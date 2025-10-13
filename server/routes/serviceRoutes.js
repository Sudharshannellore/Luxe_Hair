const express = require("express");
const upload = require("../utils/upload");
const serviceController = require("../controllers/serviceController");


const router = express.Router();

router.post("/save", upload.single("image"), serviceController.createService);
router.get("/get", serviceController.getServices);
router.get("/get/:id", serviceController.getServiceById);
router.put("/update/:id", upload.single("image"), serviceController.updateService);
router.delete("/delete/:id", serviceController.deleteService);



module.exports = router;
