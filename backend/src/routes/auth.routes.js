const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  googleAuth,
  appleAuth,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public Authentication Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/apple', appleAuth);

// Protected Routes (Requires Bearer <JWT_TOKEN> header)
router.get('/profile', protect, getUserProfile);

module.exports = router;
