const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.post('/save', messageController.createMessage);

router.get('/get', messageController.getAllMessages);

module.exports = router;
