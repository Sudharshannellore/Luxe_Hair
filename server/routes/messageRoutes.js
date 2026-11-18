const express = require("express");
const c = require("../controllers/messageController");
const validate = require("../middleware/validate");
const s = require("../validators/schemas");
const { contactLimiter } = require("../middleware/rateLimit");

const router = express.Router();

router.post("/save", contactLimiter, validate(s.message), c.createMessage);
router.get("/get", c.getAllMessages);
router.patch("/read/:id", c.markRead);
router.delete("/delete/:id", c.deleteMessage);

module.exports = router;
