const express = require("express");
const upload = require("../utils/upload");
const c = require("../controllers/packageController");
const validate = require("../middleware/validate");
const s = require("../validators/schemas");

const router = express.Router();

router.get("/get", c.getPackages);
router.get("/get/:id", c.getPackageById);
router.post("/save", upload.single("image"), validate(s.pkg), c.createPackage);
router.put("/update/:id", upload.single("image"), validate(s.pkgUpdate), c.updatePackage);
router.delete("/delete/:id", c.deletePackage);

module.exports = router;
