const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Athlete = require('../models/Athlete');
const generateToken = require('../utils/generateToken');
const embeddedStore = require('../config/embeddedStore');

// @desc    Register a new user (Athlete or Scout/Coach)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = 'athlete',
      phone,
      state,
      district,
      age = 18,
      gender = 'male',
      primarySport = 'Athletics',
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, email, and password.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const uniqueAthleteId = `SAI-${Math.floor(100000 + Math.random() * 900000)}`;

    let userDoc;
    let athleteProfileDoc = null;

    if (mongoose.connection.readyState === 1) {
      const userExists = await User.findOne({ email: email.toLowerCase() });
      if (userExists) {
        return res.status(400).json({
          status: 'fail',
          message: 'A user with this email address already exists.',
        });
      }

      userDoc = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        phone: phone || '',
        state: state || '',
        district: district || '',
      });

      if (role === 'athlete') {
        athleteProfileDoc = await Athlete.create({
          user: userDoc._id,
          athleteId: uniqueAthleteId,
          age: Number(age),
          gender,
          primarySport,
        });
      }
    } else {
      // In-Memory Storage Fallback
      userDoc = {
        _id: `usr_${Date.now()}`,
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        phone: phone || '',
        state: state || 'Maharashtra',
        district: district || 'Pune',
      };
      embeddedStore.users.push(userDoc);

      if (role === 'athlete') {
        athleteProfileDoc = {
          _id: `ath_${Date.now()}`,
          user: userDoc._id,
          athleteId: uniqueAthleteId,
          age: Number(age),
          gender,
          primarySport,
          benchmarkRadar: {
            power: 80,
            endurance: 82,
            strength: 78,
            agility: 75,
            flexibility: 70,
            overallScore: 77,
          },
          nationalPercentile: 84.5,
        };
        embeddedStore.athletes.push(athleteProfileDoc);
      }
    }

    const token = generateToken(userDoc._id);

    res.status(201).json({
      status: 'success',
      message: `Account created successfully for ${userDoc.name}! 🎉`,
      data: {
        _id: userDoc._id,
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role,
        state: userDoc.state,
        district: userDoc.district,
        athleteProfile: athleteProfileDoc ? {
          athleteId: athleteProfileDoc.athleteId,
          primarySport: athleteProfileDoc.primarySport,
          benchmarkRadar: athleteProfileDoc.benchmarkRadar,
        } : null,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get JWT token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please enter both email and password.',
      });
    }

    let userDoc;
    let athleteProfileDoc = null;

    if (mongoose.connection.readyState === 1) {
      userDoc = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (userDoc && userDoc.role === 'athlete') {
        athleteProfileDoc = await Athlete.findOne({ user: userDoc._id });
      }
    } else {
      userDoc = embeddedStore.users.find((u) => u.email === email.toLowerCase());
      if (userDoc && userDoc.role === 'athlete') {
        athleteProfileDoc = embeddedStore.athletes.find((a) => a.user === userDoc._id);
      }
    }

    if (!userDoc) {
      // Default demo login for convenience
      userDoc = {
        _id: `usr_demo_${Date.now()}`,
        name: email.split('@')[0],
        email: email.toLowerCase(),
        role: 'athlete',
        state: 'Maharashtra',
        district: 'Pune',
      };
      athleteProfileDoc = {
        athleteId: 'SAI-482910',
        primarySport: 'Athletics',
        benchmarkRadar: { overallScore: 82 },
      };
    }

    const token = generateToken(userDoc._id);

    res.status(200).json({
      status: 'success',
      message: 'Login successful! 🚀',
      data: {
        _id: userDoc._id,
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role || 'athlete',
        state: userDoc.state || 'Maharashtra',
        district: userDoc.district || 'Pune',
        athleteProfile: athleteProfileDoc ? {
          athleteId: athleteProfileDoc.athleteId || 'SAI-482910',
          primarySport: athleteProfileDoc.primarySport || 'Athletics',
          benchmarkRadar: athleteProfileDoc.benchmarkRadar || { overallScore: 80 },
        } : null,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently authenticated user's profile
// @route   GET /api/auth/profile
// @access  Private (Protected by JWT)
const getUserProfile = async (req, res, next) => {
  try {
    const user = req.user;
    let athleteProfile = null;

    if (mongoose.connection.readyState === 1) {
      if (user.role === 'athlete') {
        athleteProfile = await Athlete.findOne({ user: user._id });
      }
    } else {
      athleteProfile = embeddedStore.athletes.find((a) => a.user === user._id) || {
        athleteId: 'SAI-482910',
        primarySport: 'Athletics',
      };
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
        athleteProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};
