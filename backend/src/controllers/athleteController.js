const Athlete = require('../models/Athlete');
const User = require('../models/User');
const PerformanceResult = require('../models/PerformanceResult');

// @desc    Get current athlete's profile with benchmark scores
// @route   GET /api/athletes/profile
// @access  Private (Athlete)
const getAthleteProfile = async (req, res, next) => {
  try {
    const user = req.user;

    let athlete = await Athlete.findOne({ user: user._id });

    // If athlete record doesn't exist yet, create a default one
    if (!athlete) {
      athlete = await Athlete.create({
        user: user._id,
        age: 18,
        gender: 'male',
        primarySport: 'Athletics',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          state: user.state,
          district: user.district,
        },
        athleteProfile: athlete,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update athlete physical details and sports preferences
// @route   PUT /api/athletes/profile
// @access  Private (Athlete)
const updateAthleteProfile = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      state,
      district,
      age,
      gender,
      heightCm,
      weightKg,
      primarySport,
      clubOrAcademy,
    } = req.body;

    // 1. Update User info
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(state && { state }),
        ...(district && { district }),
      },
      { new: true, runValidators: true }
    );

    // 2. Update Athlete profile
    const updatedAthlete = await Athlete.findOneAndUpdate(
      { user: req.user._id },
      {
        ...(age && { age: Number(age) }),
        ...(gender && { gender }),
        ...(heightCm && { heightCm: Number(heightCm) }),
        ...(weightKg && { weightKg: Number(weightKg) }),
        ...(primarySport && { primarySport }),
        ...(clubOrAcademy && { clubOrAcademy }),
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Athlete profile updated successfully! 🏅',
      data: {
        user: updatedUser,
        athleteProfile: updatedAthlete,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get athlete dashboard summary, radar scorecard, and recent tests
// @route   GET /api/athletes/dashboard
// @access  Private (Athlete)
const getAthleteDashboard = async (req, res, next) => {
  try {
    let athlete = await Athlete.findOne({ user: req.user._id });

    if (!athlete) {
      athlete = await Athlete.create({
        user: req.user._id,
        age: 18,
        gender: 'male',
        primarySport: 'Athletics',
      });
    }

    // Fetch recent performance assessments
    const recentAssessments = await PerformanceResult.find({ athlete: athlete._id })
      .sort({ createdAt: -1 })
      .limit(5);

    // Khelo India 5-Axis Radar Breakdown
    const radarData = [
      { subject: 'Explosive Power', score: athlete.benchmarkRadar.power || 75, fullMark: 100 },
      { subject: 'Muscular Endurance', score: athlete.benchmarkRadar.endurance || 82, fullMark: 100 },
      { subject: 'Lower-Body Strength', score: athlete.benchmarkRadar.strength || 68, fullMark: 100 },
      { subject: 'Agility & Speed', score: athlete.benchmarkRadar.agility || 70, fullMark: 100 },
      { subject: 'Flexibility', score: athlete.benchmarkRadar.flexibility || 60, fullMark: 100 },
    ];

    res.status(200).json({
      status: 'success',
      data: {
        athleteId: athlete.athleteId,
        athleteName: req.user.name,
        sport: athlete.primarySport,
        overallScore: athlete.benchmarkRadar.overallScore || 71,
        nationalPercentile: athlete.nationalPercentile || 88.5,
        stateRank: athlete.stateRank || 42,
        radarScorecard: radarData,
        recentAssessments,
        availableDrills: [
          {
            id: 'squat',
            title: 'Squat Form & Endurance',
            category: 'Lower Body Strength',
            targetStandard: '35 reps / min (90° depth)',
          },
          {
            id: 'pushup',
            title: 'Push-Up Muscular Test',
            category: 'Upper Body Endurance',
            targetStandard: '30 reps / min (chest to floor)',
          },
          {
            id: 'jump',
            title: 'Vertical Jump Assessment',
            category: 'Explosive Leg Power',
            targetStandard: 'National Benchmark: > 55 cm',
          },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get athlete's full assessment history
// @route   GET /api/athletes/assessments
// @access  Private (Athlete)
const getAthleteAssessments = async (req, res, next) => {
  try {
    const athlete = await Athlete.findOne({ user: req.user._id });
    if (!athlete) {
      return res.status(404).json({
        status: 'fail',
        message: 'Athlete profile not found.',
      });
    }

    const assessments = await PerformanceResult.find({ athlete: athlete._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      count: assessments.length,
      data: assessments,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAthleteProfile,
  updateAthleteProfile,
  getAthleteDashboard,
  getAthleteAssessments,
};
