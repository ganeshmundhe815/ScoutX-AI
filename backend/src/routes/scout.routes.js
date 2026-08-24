const express = require('express');
const router = express.Router();
const {
  searchAndFilterPlayers,
  shortlistPlayer,
  getShortlist,
  getLeaderboard,
} = require('../controllers/scoutController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Public Leaderboard
router.get('/leaderboard', getLeaderboard);

// Protected Coach / Admin Scouting Endpoints
router.get('/players', protect, searchAndFilterPlayers);
router.post('/shortlist', protect, authorizeRoles('coach', 'admin'), shortlistPlayer);
router.get('/shortlist', protect, authorizeRoles('coach', 'admin'), getShortlist);

module.exports = router;
