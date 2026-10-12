const express = require('express');
const router = express.Router();
const {
  uploadAndAnalyzeDrill,
  getMyAssessments,
  runDemoSampleAssessment,
} = require('../controllers/assessmentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public 1-Tap Demo Assessment Route (for famous player benchmarks)
router.post('/demo-sample', runDemoSampleAssessment);

// Protected assessment routes (Player only for recording real personal assessments)
router.use(protect);

// POST /api/assessments/analyze - Upload video and run AI analysis (Player only)
router.post('/analyze', authorizeRoles('player'), upload.single('video'), uploadAndAnalyzeDrill);

// GET /api/assessments - Get current athlete's test history (Player only)
router.get('/', authorizeRoles('player'), getMyAssessments);

module.exports = router;


