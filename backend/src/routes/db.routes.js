const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Sport = require('../models/Sport');

// GET /api/db/status - Database health & ready state
router.get('/status', (req, res) => {
  const stateMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };
  const dbState = mongoose.connection.readyState;
  
  res.status(200).json({
    status: dbState === 1 ? 'connected' : 'pending',
    state: stateMap[dbState] || 'Unknown',
    databaseName: mongoose.connection.name || 'scoutx_db',
    host: mongoose.connection.host || '127.0.0.1',
    message: dbState === 1 ? 'MongoDB is actively connected! 🍃' : 'MongoDB is disconnected. Check MONGO_URI in .env',
  });
});

// POST /api/db/seed-sports - Pre-populate default sports in MongoDB
router.post('/seed-sports', async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'error',
        message: 'Cannot seed sports: MongoDB is not connected yet.',
      });
    }

    const defaultSports = [
      {
        name: 'Track & Field / Athletics',
        category: 'Track & Field',
        description: 'Sprinting, jumping, and running disciplines requiring explosive leg power.',
        priorityMetrics: [
          { metricName: 'power', weightage: 1.5 },
          { metricName: 'speed', weightage: 1.5 },
        ],
        recommendedDrills: ['jump', 'squat'],
      },
      {
        name: 'Football / Soccer',
        category: 'Team Sports',
        description: 'Requires high cardiovascular endurance, agility, and lower-body strength.',
        priorityMetrics: [
          { metricName: 'agility', weightage: 1.4 },
          { metricName: 'endurance', weightage: 1.3 },
        ],
        recommendedDrills: ['squat', 'pushup'],
      },
      {
        name: 'Cricket',
        category: 'Team Sports',
        description: 'Requires rotational power, core stability, and upper-body muscular endurance.',
        priorityMetrics: [
          { metricName: 'power', weightage: 1.2 },
          { metricName: 'endurance', weightage: 1.2 },
        ],
        recommendedDrills: ['pushup', 'jump'],
      },
      {
        name: 'Kabaddi',
        category: 'Combat Sports',
        description: 'High-intensity contact sport demanding exceptional explosive strength and lung capacity.',
        priorityMetrics: [
          { metricName: 'strength', weightage: 1.6 },
          { metricName: 'agility', weightage: 1.4 },
        ],
        recommendedDrills: ['squat', 'pushup', 'jump'],
      },
    ];

    await Sport.deleteMany({});
    const createdSports = await Sport.insertMany(defaultSports);

    res.status(201).json({
      status: 'success',
      message: `Successfully seeded ${createdSports.length} default sports categories into MongoDB!`,
      data: createdSports,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
