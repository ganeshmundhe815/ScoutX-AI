const express = require('express');
const router = express.Router();

// GET /api/health - Server health check endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'ScoutX AI Backend API is running smoothly 🚀',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(2)} seconds`,
    version: '1.0.0',
  });
});

module.exports = router;
