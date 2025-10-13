const express = require('express');
const router = express.Router();
const upload = require('../utils/upload');
const articleController = require('../controllers/articleController');

router.post('/save', upload.single('image'), articleController.createArticle);
router.get('/get', articleController.getArticles);
router.get('/:id', articleController.getArticleById);
router.put('/update/:id', upload.single('image'), articleController.updateArticle);
router.delete('/delete/:id', articleController.deleteArticle);

module.exports = router;
