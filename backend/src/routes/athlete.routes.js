const express = require('express');
const router = express.Router();
const {
  getAthleteProfile,
  updateAthleteProfile,
  getAthleteDashboard,
  getAthleteAssessments,
} = require('../controllers/athleteController');
const { protect } = require('../middleware/authMiddleware');

// All athlete routes require authentication
router.use(protect);

router.route('/profile')
  .get(getAthleteProfile)
  .put(updateAthleteProfile);

router.get('/dashboard', getAthleteDashboard);
router.get('/assessments', getAthleteAssessments);

module.exports = router;
