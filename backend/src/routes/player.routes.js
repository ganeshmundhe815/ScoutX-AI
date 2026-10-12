const express = require('express');
const router = express.Router();
const {
  getPlayerProfile,
  updatePlayerProfile,
  getPlayerStats,
  getPlayerById,
} = require('../controllers/playerController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// All player endpoints require authentication
router.use(protect);

// Player self-service profile and stats (Player only)
router.route('/profile')
  .get(authorizeRoles('player'), getPlayerProfile)
  .put(authorizeRoles('player'), updatePlayerProfile);

router.get('/stats', authorizeRoles('player'), getPlayerStats);

// Single player inspection (Available to Player, Coach, and Admin)
router.get('/:id', authorizeRoles('player', 'coach', 'admin'), getPlayerById);

module.exports = router;

