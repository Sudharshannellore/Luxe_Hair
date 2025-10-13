import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowRight, Calendar } from 'lucide-react';
import Loader from '../components/Loader';

const Articles = () => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const postsPerPage = 5;
  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch posts from backend
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/article/get`);
        setPosts(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load blogs');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(posts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const currentPosts = posts.slice(startIndex, startIndex + postsPerPage);

  if (loading)
    return (
      <div className="py-20 text-center flex justify-center items-center">
        <Loader />
      </div>
    );

  if (error)
    return <div className="py-20 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-amber-50 relative">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=1920)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60"></div>
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-light tracking-widest mb-4 uppercase">
            Beauty Tips & Insights
          </h1>
          <p className="text-lg md:text-xl font-light max-w-2xl mx-auto">
            Expert advice, treatment guides, and the latest trends from our beauty professionals
          </p>
        </div>
      </section>

      {/* Posts List */}
      <section className="px-4 sm:px-6 lg:px-8 pb-12 mt-5">
        <div className="max-w-6xl mx-auto space-y-10">
          {currentPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-sm shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
              onClick={() => setSelectedPost(post)}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Image */}
                <div className="overflow-hidden">
                  <img
                    src={`${API_URL}/uploads/${post.image}`}
                    alt={post.title}
                    className="w-full h-64 object-cover transition-transform duration-500 hover:scale-110"
                  />
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col justify-between">
                  <div>
                    <h2 className="text-lg font-medium mb-3 text-gray-800">{post.title}</h2>
                    <p className="text-stone-600 text-sm leading-relaxed line-clamp-3 mb-4">
                      {post.context}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags?.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-end">
                    <ArrowRight className="w-6 h-6 text-amber-600 hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-10 gap-3">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-4 py-2 rounded-sm bg-stone-100 text-stone-700 hover:bg-stone-200 disabled:opacity-50"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-sm ${
                  currentPage === i + 1
                    ? 'bg-amber-500 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-4 py-2 rounded-sm bg-stone-100 text-stone-700 hover:bg-stone-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </section>

      {/* Article Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 backdrop-blur-sm flex justify-center items-start z-50 overflow-auto py-10 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPost(null); // close on outside click
          }}
        >
          <div className="bg-white rounded-3xl shadow-lg w-full max-w-4xl relative animate-slideIn">
            {/* Close button */}
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-4 right-4 text-gray-600 hover:text-amber-500 transition-colors text-lg font-bold"
            >
              ×
            </button>

            {/* Article Content */}
            <div className="overflow-hidden rounded-3xl">
              {/* Image */}
              <img
                src={`${API_URL}/uploads/${selectedPost.image}`}
                alt={selectedPost.title}
                className="w-full h-64 md:h-96 object-cover transition-transform duration-500 hover:scale-105"
              />

              {/* Text Content */}
              <div className="p-8 md:p-12">
                <div className="flex items-center justify-between mb-6 text-sm text-gray-500">
                  <span>
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {new Date(selectedPost.publishDate).toLocaleDateString('en-CA')}
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-light tracking-wide mb-6 text-gray-800">
                  {selectedPost.title}
                </h1>

                <div className="flex flex-wrap gap-2 mb-8">
                  {selectedPost.tags?.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="text-stone-600 leading-relaxed whitespace-pre-line">
                  {selectedPost.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Articles;
