const mongoose = require('mongoose');
const PlayerProfile = require('../models/PlayerProfile');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const embeddedStore = require('../config/embeddedStore');

// @desc    Get logged in player's football profile
// @route   GET /api/players/profile
// @access  Private (Player)
const getPlayerProfile = async (req, res, next) => {
  try {
    const user = req.user;

    let profile;
    let achievements = [];

    if (mongoose.connection.readyState === 1) {
      profile = await PlayerProfile.findOne({ user: user._id }).populate(
        'user',
        'name email phone location'
      );

      if (!profile) {
        profile = await PlayerProfile.create({
          user: user._id,
          age: 17,
          position: 'Striker',
          preferredFoot: 'Right',
        });
      }

      achievements = await Achievement.find({ player: profile._id }).sort({
        createdAt: -1,
      });
    } else {
      // In-Memory Fallback
      profile =
        embeddedStore.playerProfiles.find((p) => p.user === user._id) ||
        embeddedStore.playerProfiles[0];
      achievements = profile.achievements || [];
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          location: user.location,
        },
        profile,
        achievements,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update player profile details
// @route   PUT /api/players/profile
// @access  Private (Player)
const updatePlayerProfile = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      state,
      district,
      city,
      age,
      position,
      preferredFoot,
      heightCm,
      weightKg,
      clubOrTeam,
      profilePhotoUrl,
    } = req.body;

    // Height and Weight Validation
    let parsedHeight = undefined;
    let parsedWeight = undefined;

    if (heightCm !== undefined) {
      if (heightCm === null || String(heightCm).trim() === '') {
        parsedHeight = null;
      } else {
        const h = Number(heightCm);
        if (isNaN(h) || h < 80 || h > 250) {
          return res.status(400).json({
            status: 'fail',
            message: 'Height must be a valid number between 80 cm and 250 cm.',
          });
        }
        parsedHeight = h;
      }
    }

    if (weightKg !== undefined) {
      if (weightKg === null || String(weightKg).trim() === '') {
        parsedWeight = null;
      } else {
        const w = Number(weightKg);
        if (isNaN(w) || w < 25 || w > 200) {
          return res.status(400).json({
            status: 'fail',
            message: 'Weight must be a valid number between 25 kg and 200 kg.',
          });
        }
        parsedWeight = w;
      }
    }

    let updatedUser;
    let updatedProfile;

    if (mongoose.connection.readyState === 1) {
      // 1. Update user info
      updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(state && { 'location.state': state }),
          ...(district && { 'location.district': district }),
          ...(city && { 'location.city': city }),
        },
        { new: true, runValidators: true }
      );

      // 2. Update player profile
      updatedProfile = await PlayerProfile.findOneAndUpdate(
        { user: req.user._id },
        {
          ...(age && { age: Number(age) }),
          ...(position && { position, playing_position: position }),
          ...(preferredFoot && { preferredFoot }),
          ...(parsedHeight !== undefined && { heightCm: parsedHeight }),
          ...(parsedWeight !== undefined && { weightKg: parsedWeight }),
          ...(clubOrTeam && { clubOrTeam }),
          ...(profilePhotoUrl && { profilePhotoUrl }),
        },
        { new: true, upsert: true, runValidators: true }
      );
    } else {
      // In-Memory Fallback
      updatedUser = embeddedStore.users.find((u) => u._id === req.user._id) || req.user;
      if (name) updatedUser.name = name;
      if (phone) updatedUser.phone = phone;

      updatedProfile =
        embeddedStore.playerProfiles.find((p) => p.user === req.user._id) ||
        embeddedStore.playerProfiles[0];

      if (age) updatedProfile.age = Number(age);
      if (position) {
        updatedProfile.position = position;
        updatedProfile.playing_position = position;
      }
      if (preferredFoot) updatedProfile.preferredFoot = preferredFoot;
      if (parsedHeight !== undefined) updatedProfile.heightCm = parsedHeight;
      if (parsedWeight !== undefined) updatedProfile.weightKg = parsedWeight;
      if (clubOrTeam) updatedProfile.clubOrTeam = clubOrTeam;
    }

    res.status(200).json({
      status: 'success',
      message: 'Football player profile updated successfully! ⚽',
      data: {
        user: updatedUser,
        profile: updatedProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get technical football stats & radar breakdown
// @route   GET /api/players/stats
// @access  Private (Player or Coach)
const getPlayerStats = async (req, res, next) => {
  try {
    const user = req.user;
    let profile;

    if (mongoose.connection.readyState === 1) {
      profile = await PlayerProfile.findOne({ user: user._id });
    } else {
      profile =
        embeddedStore.playerProfiles.find((p) => p.user === user._id) ||
        embeddedStore.playerProfiles[0];
    }

    if (!profile) {
      return res.status(404).json({
        status: 'fail',
        message: 'Player profile not found.',
      });
    }

    const radarStats = [
      { attribute: 'Dribbling', score: profile.dribblingScore || 75, fullMark: 100 },
      { attribute: 'Shooting', score: profile.shootingScore || 75, fullMark: 100 },
      { attribute: 'Ball Control', score: profile.ballControlScore || 75, fullMark: 100 },
      { attribute: 'Shot Accuracy', score: profile.shotAccuracy || 70, fullMark: 100 },
      { attribute: 'Estimated Power', score: profile.estimatedPower || 72, fullMark: 100 },
    ];

    res.status(200).json({
      status: 'success',
      data: {
        playerId: profile.playerId,
        position: profile.position,
        preferredFoot: profile.preferredFoot,
        overallScore: profile.overallScore,
        nationalPercentile: profile.nationalPercentile,
        assessmentCount: profile.assessmentCount,
        radarStats,
        drills: [
          {
            id: 'dribbling',
            name: 'Slalom & Cone Dribbling',
            category: 'Agility & Close Control',
            description: 'Measures ball touch frequency, directional transitions, and player-ball proximity.',
          },
          {
            id: 'shooting',
            name: 'Target Shooting Drill',
            category: 'Finishing & Power',
            description: 'Analyzes shot trajectory, on-target accuracy %, and relative estimated power.',
          },
          {
            id: 'ball_control',
            name: 'First Touch & Juggling',
            category: 'Ball Mastery',
            description: 'Evaluates ball-player contact consistency, rebound control, and left/right foot balance.',
          },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single player by ID (for coach or scout view)
// @route   GET /api/players/:id
// @access  Private (Coach / Admin / Player)
const getPlayerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let profile;
    if (mongoose.connection.readyState === 1) {
      profile = await PlayerProfile.findById(id).populate('user', 'name email phone location');
      if (!profile) {
        // Try searching by custom playerId (FB-XXXXXX)
        profile = await PlayerProfile.findOne({ playerId: id }).populate('user', 'name email phone location');
      }
    } else {
      profile =
        embeddedStore.playerProfiles.find((p) => p._id === id || p.playerId === id) ||
        embeddedStore.playerProfiles[0];
    }

    if (!profile) {
      return res.status(404).json({
        status: 'fail',
        message: `Player with ID '${id}' not found.`,
      });
    }

    res.status(200).json({
      status: 'success',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlayerProfile,
  updatePlayerProfile,
  getPlayerStats,
  getPlayerById,
};
