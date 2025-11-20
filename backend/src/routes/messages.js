const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getMessages)
  .post(protect, sendMessage);

router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteMessage);

module.exports = router;
