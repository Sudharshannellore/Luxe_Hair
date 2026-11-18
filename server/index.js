const config = require("./config"); // loads .env first
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const path = require("path");

const { notFound, errorHandler } = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimit");
const { httpError } = require("./utils/httpError");
const { startJobs } = require("./orderJobs");
const Message = require("./models/Message");

const app = express();
app.set("trust proxy", 1); // correct client IPs behind Render/Railway/NGINX for rate limiting

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // images are loaded by the client/admin origins
  })
);
// CORS allow-list.
//  - CLIENT_URLS entries may use "*" wildcards, e.g. https://*.vercel.app
//  - Outside production, any localhost / 127.0.0.1 port is allowed, so Vite picking
//    another port (5175, 4173, …) never breaks local development.
const LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
const allowList = config.clientUrls.map((url) =>
  url.includes("*")
    ? new RegExp(`^${url.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]+")}$`)
    : url.replace(/\/$/, "")
);
const isAllowedOrigin = (origin) =>
  allowList.some((rule) => (rule instanceof RegExp ? rule.test(origin) : rule === origin)) ||
  (config.nodeEnv !== "production" && LOCALHOST.test(origin));

app.use(
  cors({
    origin(origin, cb) {
      // Non-browser clients (curl, server-to-server) send no Origin header.
      if (!origin || isAllowedOrigin(origin)) return cb(null, true);
      cb(httpError(403, `Origin ${origin} is not allowed. Add it to CLIENT_URLS in server/.env.`));
    },
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(apiLimiter);

app.use("/uploads", express.static(path.join(__dirname, "uploads"), { maxAge: "7d" }));

app.get("/", (req, res) => res.json({ name: `${config.brandName} API`, status: "ok" }));
app.get("/health", (req, res) =>
  res.json({ status: "ok", db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" })
);

app.use("/user", require("./routes/userRoutes"));
app.use("/service", require("./routes/serviceRoutes"));
app.use("/package", require("./routes/packageRoutes"));
app.use("/booking", require("./routes/serviceBookingRoutes"));
app.use("/order", require("./routes/packageOrderRoute"));
app.use("/dashboard", require("./routes/dashboardRoute"));
app.use("/staff", require("./routes/staffRoutes"));
app.use("/review", require("./routes/reviewRoute"));
app.use("/message", require("./routes/messageRoutes"));
app.use("/payment", require("./routes/paymentSettingRoute"));
app.use("/article", require("./routes/articleRoutes"));
app.use("/coupon", require("./routes/couponRoute"));

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  try {
    await mongoose.connect(config.mongoUrl);
    console.log("MongoDB connected");
    // Drops the old unique index on message email so people can message more than once.
    await Message.syncIndexes().catch((err) => console.warn("Message index sync skipped:", err.message));
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }

  app.listen(config.port, () => console.log(`Server running on port ${config.port}`));
  startJobs();
};

if (require.main === module) start();

module.exports = app;
