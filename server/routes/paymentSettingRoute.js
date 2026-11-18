const express = require("express");
const settings = require("../controllers/paymentSettingController");
const payment = require("../controllers/paymentController");
const validate = require("../middleware/validate");
const s = require("../validators/schemas");
const { requireUser } = require("../middleware/auth");

const router = express.Router();

router.get("/get/payment-method", settings.getSettings);
router.patch("/update/payment-setting", validate(s.paymentSettings), settings.updatePaymentSettings);

// Demo online checkout (no real money is charged)
router.post("/demo/confirm", requireUser, validate(s.confirmPayment), payment.confirm);
router.post("/demo/cancel", requireUser, validate(s.cancelPayment), payment.cancel);

module.exports = router;
