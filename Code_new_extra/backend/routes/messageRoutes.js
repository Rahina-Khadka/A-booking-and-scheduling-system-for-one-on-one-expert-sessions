const express = require('express');
const { getMessages, saveMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Message routes (all protected)
router.get('/:bookingId', protect, getMessages);
router.post('/', protect, saveMessage);

module.exports = router;
