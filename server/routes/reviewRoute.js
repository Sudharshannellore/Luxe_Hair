const express = require('express')
const reviewController = require('../controllers/reviewController')
const VerifyUserToken = require("../middleware/VerifyUserToken");

const router = express.Router()

router.post("/send/package/:id", VerifyUserToken, reviewController.addPackageReview);
router.get("/get/package/:id", VerifyUserToken, reviewController.getPackageReview);
router.post("/send/service/:id", VerifyUserToken, reviewController.addServiceReview)
router.get("/get/service/:id", VerifyUserToken, reviewController.getServiceReview)
router.get("/all-reviews", reviewController.getAllReviewsSeparated);

module.exports = router;