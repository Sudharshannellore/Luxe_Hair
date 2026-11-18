const multer = require("multer");
const path = require("path");
const fs = require("fs");
const config = require("../config");
const { httpError } = require("./httpError");

// When the Cloudinary keys are set, images go to Cloudinary and the stored value is the
// full https URL. Otherwise they are written to ./uploads and the stored value is
// the file name (served at /uploads/<name>). The frontends handle both forms.
const { cloudName, apiKey, apiSecret } = config.cloudinary;
const useCloudinary = Boolean(cloudName && apiKey && apiSecret);

let cloudinary = null;
if (useCloudinary) {
  cloudinary = require("cloudinary").v2;
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
} else if (cloudName || apiKey || apiSecret) {
  console.warn("Cloudinary disabled: set all of CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.");
}

const uploadPath = path.join(__dirname, "../uploads/");
if (!useCloudinary && !fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const ALLOWED = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

const safeBaseName = (name) =>
  path
    .basename(name, path.extname(name))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "image";

const storage = useCloudinary
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadPath),
      filename: (req, file, cb) =>
        cb(null, `${Date.now()}-${safeBaseName(file.originalname)}${ALLOWED[file.mimetype]}`),
    });

const fileFilter = (req, file, cb) => {
  if (ALLOWED[file.mimetype]) cb(null, true);
  else cb(httpError(400, "Invalid file type. Only JPG, PNG and WEBP images are allowed."), false);
};

const multerInstance = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const pushToCloudinary = (req, res, next) => {
  if (!useCloudinary || !req.file) return next();
  const stream = cloudinary.uploader.upload_stream(
    { folder: "luxe-hair", resource_type: "image" },
    (err, result) => {
      if (err) return next(httpError(502, "Image upload failed. Please try again."));
      req.file.filename = result.secure_url;
      next();
    }
  );
  stream.end(req.file.buffer);
};

// upload.single("image") returns a middleware chain usable directly in routes.
module.exports = {
  single: (field) => [multerInstance.single(field), pushToCloudinary],
};
