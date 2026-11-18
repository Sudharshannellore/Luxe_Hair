const express = require("express");
const upload = require("../utils/upload");
const c = require("../controllers/serviceController");
const validate = require("../middleware/validate");
const s = require("../validators/schemas");

const router = express.Router();

router.get("/get", c.getServices);
router.get("/get/:id", c.getServiceById);
router.post("/save", upload.single("image"), validate(s.service), c.createService);
router.put("/update/:id", upload.single("image"), validate(s.serviceUpdate), c.updateService);
router.delete("/delete/:id", c.deleteService);

module.exports = router;
