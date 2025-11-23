const express = require('express');
const router = express.Router();
const { login, getMe, googleLogin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// router.post('/register', register); // Disabled public registration
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);

module.exports = router;
