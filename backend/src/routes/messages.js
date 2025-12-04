const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// Configure multer for message attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `msg-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images, pdfs, xml, text, docs
  const filetypes = /jpeg|jpg|png|gif|webp|pdf|xml|txt|doc|docx|xls|xlsx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Mime type check can be tricky for some types, so relying mostly on extension for now or broad types
  // But let's try to be safe
  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Unsupported file type!'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10000000 }, // 10MB limit
  fileFilter: fileFilter
});

router.route('/')
  .get(protect, getMessages)
  .post(protect, upload.array('attachments', 5), sendMessage);

router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteMessage);

module.exports = router;
