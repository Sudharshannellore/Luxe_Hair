require("dotenv").config({ quiet: true });

const required = ["MONGO_URL", "JWT_SECRET"];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const list = (value, fallback) =>
  (value || fallback)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

module.exports = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUrl: process.env.MONGO_URL,
  jwtSecret: process.env.JWT_SECRET,
  clientUrls: list(process.env.CLIENT_URLS, "http://localhost:5173,http://localhost:5174"),
  timezone: process.env.APP_TIMEZONE || "Asia/Kolkata",
  brandName: process.env.BRAND_NAME || "Luxe Hair",
  publicSiteUrl: process.env.PUBLIC_SITE_URL || "http://localhost:5173",
  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
};
