const rateLimit = require("express-rate-limit");

const make = (windowMinutes, limit, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message },
  });

module.exports = {
  apiLimiter: make(15, 1000, "Too many requests, please slow down."),
  authLimiter: make(15, 20, "Too many sign-in attempts. Try again in 15 minutes."),
  couponLimiter: make(15, 60, "Too many coupon attempts. Try again later."),
  contactLimiter: make(60, 10, "Too many messages sent. Try again later."),
};
