const Article = require("../models/Article");
const { httpError } = require("../utils/httpError");

exports.createArticle = async (req, res) => {
  const article = await Article.create({
    ...req.body,
    tags: req.body.tags || [],
    image: req.file ? req.file.filename : "no-image.png",
  });
  res.status(201).json({ message: "Article published", article });
};

exports.getArticles = async (req, res) => {
  res.json(await Article.find().sort({ publishDate: -1 }).lean());
};

exports.getArticleById = async (req, res) => {
  const article = await Article.findById(req.params.id).lean();
  if (!article) throw httpError(404, "Article not found");
  res.json(article);
};

exports.updateArticle = async (req, res) => {
  const update = { ...req.body };
  if (req.file) update.image = req.file.filename;
  const article = await Article.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!article) throw httpError(404, "Article not found");
  res.json({ message: "Article updated", article });
};

exports.deleteArticle = async (req, res) => {
  const article = await Article.findByIdAndDelete(req.params.id);
  if (!article) throw httpError(404, "Article not found");
  res.json({ message: "Article deleted" });
};
