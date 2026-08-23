const express = require('express');
const router = express.Router();
const {
  getNationalLeaderboard,
  submitCoachFeedback,
} = require('../controllers/scoutController');
const { protect } = require('../middleware/authMiddleware');

// Public / Authenticated Leaderboard
router.get('/leaderboard', getNationalLeaderboard);

// Protected Coach Actions
router.post('/feedback', protect, submitCoachFeedback);

module.exports = router;
