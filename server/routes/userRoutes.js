const express = require('express');
const upload = require('../utils/upload');
const userController = require('../controllers/userController');
const verifyUserToken = require("../middleware/VerifyUserToken");

const router = express.Router();

router.post('/register', upload.single("image"), userController.registerUser);
router.post('/login', userController.loginUser);
router.put('/update', verifyUserToken, upload.single('image'), userController.updateUser);

module.exports = router;
