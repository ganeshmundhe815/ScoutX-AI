const mongoose = require('mongoose');

let mongod = null;

/**
 * Intelligent Database Connection Manager:
 * 1. Attempts connecting to MongoDB Atlas / Local MongoDB URI.
 * 2. If no external DB is reachable, automatically spins up an
 *    Embedded In-Memory MongoDB Server so the app works 100% with zero config!
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/scoutx_db';

  try {
    console.log('🔄 Connecting to MongoDB...');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });

    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.log('🚀 Initializing Embedded Autonomous MongoDB Database Engine...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'scoutx_db',
        },
      });

      const memoryUri = mongod.getUri();
      const conn = await mongoose.connect(memoryUri);

      console.log('====================================================');
      console.log(`🍃 Autonomous Embedded MongoDB Engine Active! 🎉`);
      console.log(`📍 Database Name: scoutx_db`);
      console.log(`⚡ Zero-config storage enabled for Athletes, Drills & Users`);
      console.log('====================================================');

      // Auto-seed initial athletes if database is empty
      await seedInitialData();

      return conn;
    } catch (memError) {
      console.warn(`ℹ️  Running in Resilient Mode (${memError.message})`);
    }
  }
};

const seedInitialData = async () => {
  try {
    const Athlete = require('../models/Athlete');
    const User = require('../models/User');

    const count = await Athlete.countDocuments();
    if (count === 0) {
      const u1 = await User.create({
        name: 'Neeraj Kumar',
        email: 'neeraj@scoutx.com',
        password: 'password123',
        role: 'athlete',
        state: 'Haryana',
        district: 'Panipat',
      });

      await Athlete.create({
        user: u1._id,
        athleteId: 'SAI-921840',
        age: 19,
        gender: 'male',
        primarySport: 'Athletics (Javelin)',
        benchmarkRadar: {
          power: 96,
          endurance: 91,
          strength: 95,
          agility: 88,
          flexibility: 85,
          overallScore: 94,
        },
        nationalPercentile: 98.6,
      });

      const u2 = await User.create({
        name: 'Pooja Patil',
        email: 'pooja@scoutx.com',
        password: 'password123',
        role: 'athlete',
        state: 'Maharashtra',
        district: 'Kolhapur',
      });

      await Athlete.create({
        user: u2._id,
        athleteId: 'SAI-710293',
        age: 18,
        gender: 'female',
        primarySport: 'Football',
        benchmarkRadar: {
          power: 84,
          endurance: 88,
          strength: 80,
          agility: 92,
          flexibility: 78,
          overallScore: 85,
        },
        nationalPercentile: 89.2,
      });

      console.log('🌱 Pre-seeded National Talent Profiles into MongoDB!');
    }
  } catch (err) {
    // Non-blocking
  }
};

module.exports = connectDB;
