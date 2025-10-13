const Article = require('../models/Article');


exports.createArticle = async (req, res) => {
  try {
    const { title, context, tags, content } = req.body;

    const newArticle = new Article({
      title,
      context,
      tags: tags ? JSON.parse(tags) : [],
      image: req.file ? req.file.filename : "no-image.png",
      content
    });

    await newArticle.save();
    res.status(201).json({ message: "Article created successfully", article: newArticle });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getArticles = async (req, res) => {
  try {
    const articles = await Article.find().sort({ publishDate: -1 });
    res.status(200).json(articles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found" });
    res.status(200).json(article);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const { title, context,   tags, content } = req.body;

    const updatedData = {
      title,
      context,
      tags: tags ? JSON.parse(tags) : [],
      content
    };

    if (req.file) updatedData.image = req.file.filename;

    const article = await Article.findByIdAndUpdate(req.params.id, updatedData, { new: true });

    if (!article) return res.status(404).json({ message: "Article not found" });

    res.status(200).json({ message: "Article updated successfully", article });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found" });
    res.status(200).json({ message: "Article deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
