// models/Article.js
const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  context: { type: String, required: true },
  image: { type: String },
  publishDate: { type: Date, default: Date.now },
  tags: [String],
  content: { type: String, required: true }
});

module.exports = mongoose.model('Article', articleSchema);
