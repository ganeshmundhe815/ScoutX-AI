const express = require('express');
const router = express.Router();
const {
  searchAndFilterPlayers,
  shortlistPlayer,
  getShortlist,
  removeFromShortlist,
  getLeaderboard,
  getFamousBenchmarks,
  getBenchmarkDetail,
} = require('../controllers/scoutController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Public Leaderboard & Star Player Benchmarks
router.get('/leaderboard', getLeaderboard);
router.get('/benchmarks', getFamousBenchmarks);
router.get('/benchmarks/:id', getBenchmarkDetail);

// Protected Coach / Admin Scouting Discovery
router.get('/players', protect, authorizeRoles('coach', 'admin'), searchAndFilterPlayers);

// Protected Coach Shortlisting
router.post('/shortlist', protect, authorizeRoles('coach'), shortlistPlayer);
router.get('/shortlist', protect, authorizeRoles('coach'), getShortlist);
router.delete('/shortlist/:playerId', protect, authorizeRoles('coach'), removeFromShortlist);

module.exports = router;


