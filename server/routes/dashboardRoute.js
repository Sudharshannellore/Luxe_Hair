const express = require("express");
const c = require("../controllers/dashboardController");

const router = express.Router();

router.get("/get", c.getStats);

module.exports = router;
