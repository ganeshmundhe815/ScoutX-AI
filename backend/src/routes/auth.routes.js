const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public Authentication Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected Routes (Requires Bearer <JWT_TOKEN> header)
router.get('/profile', protect, getUserProfile);

module.exports = router;
