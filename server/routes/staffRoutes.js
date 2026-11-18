const express = require("express");
const upload = require("../utils/upload");
const c = require("../controllers/staffController");
const validate = require("../middleware/validate");
const s = require("../validators/schemas");

const router = express.Router();

router.get("/public", c.getPublicStaff);
router.get("/get", c.getAllStaff);
// ?date=YYYY-MM-DD&timeSlot=HH:mm excludes staff already booked in that slot
router.get("/active-staff", c.getActiveStaff);
router.post("/save", upload.single("image"), validate(s.staff), c.createStaff);
router.put("/update/:id", upload.single("image"), validate(s.staffUpdate), c.updateStaff);
router.delete("/delete/:id", c.deleteStaff);

module.exports = router;
