const express = require("express");
const c = require("../controllers/reviewController");
const validate = require("../middleware/validate");
const s = require("../validators/schemas");
const { requireUser } = require("../middleware/auth");

const router = express.Router();

router.get("/public", c.getPublicReviews);

router.post("/send/package/:id", requireUser, validate(s.review), c.addPackageReview);
router.get("/get/package/:id", requireUser, c.getPackageReview);
router.post("/send/service/:id", requireUser, validate(s.review), c.addServiceReview);
router.get("/get/service/:id", requireUser, c.getServiceReview);

router.get("/all-reviews", c.getAllReviewsSeparated);
router.delete("/:type/:docId/:reviewId", c.deleteReview);

module.exports = router;
