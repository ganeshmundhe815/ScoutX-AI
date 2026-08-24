const express = require('express');
const router = express.Router();
const {
  getPlayerProfile,
  updatePlayerProfile,
  getPlayerStats,
  getPlayerById,
} = require('../controllers/playerController');
const { protect } = require('../middleware/authMiddleware');

// All player endpoints require authentication
router.use(protect);

router.route('/profile')
  .get(getPlayerProfile)
  .put(updatePlayerProfile);

router.get('/stats', getPlayerStats);
router.get('/:id', getPlayerById);

module.exports = router;
