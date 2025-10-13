import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Eye, X } from "lucide-react";
import {
  fetchArticlesApi,
  createArticleApi,
  updateArticleApi,
  deleteArticleApi,
} from "../apis/articleApi";
import Loader from "../components/Loader";

const Article = () => {
  const API_URL = import.meta.env.VITE_API_URL;

  const [articles, setArticles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [editingArticle, setEditingArticle] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [image, setImage] = useState(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const data = await fetchArticlesApi();
      setArticles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContext("");
    setContent("");
    setTags([]);
    setTagInput("");
    setImage(null);
    setEditingArticle(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("context", context);
      formData.append("content", content);
      formData.append("tags", JSON.stringify(tags));
      if (image) formData.append("image", image);

      let res;
      if (editingArticle) {
        res = await updateArticleApi(editingArticle._id, formData);
        setArticles(articles.map((a) => (a._id === editingArticle._id ? res : a)));
      } else {
        res = await createArticleApi(formData);
        setArticles([...articles, res]);
      }

      setIsModalOpen(false);
      resetForm();
      fetchArticles();
    } catch (error) {
      console.error("Error saving article:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deleteArticleApi(id);
      setArticles(articles.filter((a) => a._id !== id));
      fetchArticles();
    } catch (error) {
      console.error("Error deleting article:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    setTitle(article.title);
    setContext(article.context);
    setContent(article.content);
    setTags(article.tags);
    setTagInput("");
    setImage(null);
    setIsModalOpen(true);
  };

  /** safer filter logic **/
  const safeSearchTerm = (searchTerm || "").toLowerCase();
  const filteredArticles = articles.filter((article) => {
    const title = (article?.title || "").toLowerCase();
    const tags = Array.isArray(article?.tags) ? article.tags : [];

    const matchesSearch = title.includes(safeSearchTerm);
    const matchesTag = tagFilter === "all" || tags.includes(tagFilter);

    return matchesSearch && matchesTag;
  });

  const tagsList = [...new Set(articles.flatMap((a) => Array.isArray(a.tags) ? a.tags : []))];

  return (
    <div className="space-y-6 relative">
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <Loader />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Articles</h1>
          <p className="mt-2 text-gray-600">Manage your blog posts</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-amber-700 text-white text-sm font-medium rounded-xl transition-all duration-200"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Article
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-2xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Tags</option>
            {tagsList.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <div
              key={article._id}
              className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow bg-white"
            >
              <img
                src={
                  article.image
                    ? `${API_URL}/uploads/${article.image}`
                    : "https://via.placeholder.com/600x400?text=No+Image"
                }
                alt={article.title || "No title"}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{article.title}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">{article.context}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {(Array.isArray(article.tags) ? article.tags : []).map((t, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedArticle(article)}
                    className="flex-1 px-3 py-2 text-blue-600 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Eye className="h-4 w-4 inline mr-1" /> View
                  </button>
                  <button
                    onClick={() => handleEdit(article)}
                    className="flex-1 px-3 py-2 text-green-600 bg-green-100 hover:bg-green-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Edit className="h-4 w-4 inline mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(article._id)}
                    className="px-3 py-2 text-red-600 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingArticle ? "Edit Article" : "Add New Article"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Article Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <textarea
                placeholder="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <textarea
                placeholder="Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                rows={5}
                required
              />

              {/* Tags */}
              <div>
                <label className="block mb-1 text-sm font-medium">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tagInput.trim() !== "") {
                        setTags([...tags, tagInput.trim()]);
                        setTagInput("");
                      }
                    }}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((t, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-sm"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() =>
                          setTags(tags.filter((_, i) => i !== index))
                        }
                        className="text-red-500 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <input
                type="file"
                onChange={(e) => setImage(e.target.files[0])}
                className="w-full"
              />

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-700 text-white rounded-lg"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={
                selectedArticle.image
                  ? `${API_URL}/uploads/${selectedArticle.image}`
                  : "https://via.placeholder.com/600x400?text=No+Image"
              }
              alt={selectedArticle.title || "No title"}
              className="w-full h-56 object-cover rounded-lg mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedArticle.title}</h2>
            <p className="text-gray-700 mb-4">{selectedArticle.context}</p>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Content</h3>
              <p className="text-gray-600">{selectedArticle.content}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {(Array.isArray(selectedArticle.tags) ? selectedArticle.tags : []).map((t, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Article;
