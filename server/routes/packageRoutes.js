const express = require("express");
const upload = require("../utils/upload");
const packageController = require("../controllers/packageController");
const VerifyUserToken = require("../middleware/VerifyUserToken");

const router = express.Router();

router.post("/save", upload.single("image"), packageController.createPackage);
router.get("/get", packageController.getPackages);
router.get("/get/:id", packageController.getPackageById);
router.put("/update/:id", upload.single("image"), packageController.updatePackage);
router.delete("/delete/:id", packageController.deletePackage);



module.exports = router;
