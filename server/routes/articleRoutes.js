const express = require("express");
const upload = require("../utils/upload");
const c = require("../controllers/articleController");
const validate = require("../middleware/validate");
const s = require("../validators/schemas");

const router = express.Router();

router.get("/get", c.getArticles);
router.post("/save", upload.single("image"), validate(s.article), c.createArticle);
router.put("/update/:id", upload.single("image"), validate(s.articleUpdate), c.updateArticle);
router.delete("/delete/:id", c.deleteArticle);
router.get("/:id", c.getArticleById);

module.exports = router;
