const express = require("express");
const router = express.Router();
const paymentCtrl = require("../controllers/paymentSettingController");

// get current settings
router.get("/get/payment-method", paymentCtrl.getSettings);

// update settings
router.patch("/update/payment-setting", paymentCtrl.updatePaymentSettings);

module.exports = router;
