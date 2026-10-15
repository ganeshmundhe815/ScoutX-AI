const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { checkAIHealth } = require('../services/aiService');

// GET /api/health - Comprehensive system health check endpoint
router.get('/', async (req, res) => {
  const aiHealth = await checkAIHealth();
  const isMongoConnected = mongoose.connection.readyState === 1;

  res.status(200).json({
    status: 'success',
    message: 'ScoutX AI Backend API is running smoothly 🚀',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(2)} seconds`,
    version: '1.0.0',
    database: {
      status: isMongoConnected ? 'connected' : 'in-memory-fallback',
      engine: isMongoConnected ? 'MongoDB' : 'ScoutX Embedded Memory Store',
      readyState: mongoose.connection.readyState,
    },
    aiMicroservice: {
      status: aiHealth.status,
      online: aiHealth.online,
      url: aiHealth.url,
      latencyMs: aiHealth.latencyMs,
      details: aiHealth.data || null,
      error: aiHealth.error || null,
    },
  });
});

module.exports = router;

