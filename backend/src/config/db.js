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
    await seedInitialData();
    return conn;
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      const sanitizedUri = uri.replace(/\/\/.*@/, '//<credentials>@');
      console.error('====================================================');
      console.error('❌ [CRITICAL PRODUCTION ERROR] MongoDB Connection Failed!');
      console.error(`📍 Attempted URI: ${sanitizedUri}`);
      console.error(`💥 Error Details: ${error.message}`);
      console.error('⚠️ In production mode, temporary in-memory storage is disabled to prevent user data loss.');
      console.error('👉 Troubleshooting Checklist:');
      console.error('   1. Check MONGO_URI in your cloud/production environment variables.');
      console.error('   2. Verify MongoDB Atlas Network Access (IP Access List: e.g. 0.0.0.0/0).');
      console.error('   3. Verify database user credentials and permissions in MongoDB Atlas.');
      console.error('====================================================');
      throw new Error(`Production MongoDB connection failed: ${error.message}`);
    }

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

    const PlayerProfile = require('../models/PlayerProfile');
    const CoachProfile = require('../models/CoachProfile');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Ensure player@scoutx.com exists
    const existingPlayer = await User.findOne({ email: 'player@scoutx.com' });
    if (!existingPlayer) {
      const pUser = await User.create({
        name: 'Sunil Chhetri Jr',
        email: 'player@scoutx.com',
        password: hashedPassword,
        password_hash: hashedPassword,
        role: 'player',
        phone: '9876543210',
        location: { state: 'Karnataka', district: 'Bengaluru', city: 'Bengaluru' },
        isActive: true,
      });

      await PlayerProfile.create({
        user: pUser._id,
        playerId: 'FB-882104',
        age: 18,
        position: 'Striker',
        city: 'Bengaluru',
        preferredFoot: 'Right',
        heightCm: 178,
        weightKg: 72,
        clubOrTeam: 'Bengaluru Youth FC',
        overallScore: 90.0,
        dribblingScore: 91.0,
        shootingScore: 93.0,
        ballControlScore: 87.0,
        shotAccuracy: 89.0,
        estimatedPower: 86.0,
        nationalPercentile: 96.4,
        assessmentCount: 4,
      });
    }

    // Ensure coach@scoutx.com exists
    const existingCoach = await User.findOne({ email: 'coach@scoutx.com' });
    if (!existingCoach) {
      const cUser = await User.create({
        name: 'Coach Ranjan Patil',
        email: 'coach@scoutx.com',
        password: hashedPassword,
        password_hash: hashedPassword,
        role: 'coach',
        phone: '9876543212',
        location: { state: 'Maharashtra', district: 'Mumbai', city: 'Mumbai' },
        isActive: true,
      });

      await CoachProfile.create({
        user: cUser._id,
        coachId: 'COACH-102941',
        clubOrAcademy: 'Mumbai City Youth Academy',
        licenseLevel: 'AFC A / UEFA A',
        experienceYears: 12,
      });
    }

    // Ensure admin@scoutx.com exists
    const existingAdmin = await User.findOne({ email: 'admin@scoutx.com' });
    if (!existingAdmin) {
      await User.create({
        name: 'ScoutX Football Admin',
        email: 'admin@scoutx.com',
        password: hashedPassword,
        password_hash: hashedPassword,
        role: 'admin',
        phone: '9876543299',
        location: { state: 'Maharashtra', district: 'Pune', city: 'Pune' },
        isActive: true,
      });
    }

    // Ensure ganeshmundhe815@gmail.com exists as approved admin
    const existingGanesh = await User.findOne({ email: 'ganeshmundhe815@gmail.com' });
    if (!existingGanesh) {
      await User.create({
        name: 'Ganesh Mundhe',
        email: 'ganeshmundhe815@gmail.com',
        password: hashedPassword,
        password_hash: hashedPassword,
        role: 'admin',
        phone: '9876543288',
        location: { state: 'Maharashtra', district: 'Pune', city: 'Pune' },
        isActive: true,
      });
    }

    console.log('✅ ScoutX Core Demo Accounts (Player, Coach, Admins) Seeded!');
  } catch (err) {
    console.warn('[Seed Error]:', err.message);
  }
};

module.exports = connectDB;
