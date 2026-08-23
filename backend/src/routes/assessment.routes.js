const express = require('express');
const router = express.Router();
const {
  uploadAndAnalyzeDrill,
  getMyAssessments,
} = require('../controllers/assessmentController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All assessment routes require authentication
router.use(protect);

// POST /api/assessments/analyze - Upload video and run AI analysis
router.post('/analyze', upload.single('video'), uploadAndAnalyzeDrill);

// GET /api/assessments - Get current athlete's test history
router.get('/', getMyAssessments);

module.exports = router;
