const express = require("express");
const upload = require("../utils/upload");
const c = require("../controllers/userController");
const validate = require("../middleware/validate");
const s = require("../validators/schemas");
const { requireUser } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimit");

const router = express.Router();

router.post("/register", authLimiter, upload.single("image"), validate(s.register), c.registerUser);
router.post("/login", authLimiter, validate(s.login), c.loginUser);
router.get("/me", requireUser, c.getMe);
router.put("/update", requireUser, upload.single("image"), validate(s.updateUser), c.updateUser);

module.exports = router;
