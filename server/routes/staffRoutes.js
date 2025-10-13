const express = require('express')
const staffController = require('../controllers/staffController')
const upload = require("../utils/upload");


const router = express.Router()

router.post('/save', upload.single("image") , staffController.createStaff);
router.get('/get', staffController.getAllStaff);
router.put('/update/:id', upload.single("image") ,staffController.updateStaff);
router.delete('/delete/:id', staffController.deleteStaff);
router.get('/active-staff', staffController.getStaffByStatus)

module.exports = router;