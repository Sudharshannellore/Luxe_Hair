const express = require("express");
const router = express.Router();
const dashboardController = require('../controllers/dashboardController')

// Use service
router.get("/get", dashboardController.getStats);

module.exports = router;
