const mongoose = require('mongoose');
const Athlete = require('../models/Athlete');
const CoachFeedback = require('../models/CoachFeedback');
const embeddedStore = require('../config/embeddedStore');

// @desc    Get national sports talent leaderboard (Ranked by athletic score & percentile)
// @route   GET /api/scouts/leaderboard
// @access  Public / Scout
const getNationalLeaderboard = async (req, res, next) => {
  try {
    const { sport, state, limit = 20 } = req.query;

    // If MongoDB is connected, query from MongoDB
    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (sport) {
        query.primarySport = new RegExp(sport, 'i');
      }

      const athletes = await Athlete.find(query)
        .populate('user', 'name email state district phone')
        .sort({ 'benchmarkRadar.overallScore': -1, nationalPercentile: -1 })
        .limit(Number(limit));

      if (athletes.length > 0) {
        const leaderboard = athletes.map((athlete, index) => ({
          rank: index + 1,
          athleteId: athlete.athleteId,
          name: athlete.user?.name || 'Athlete',
          email: athlete.user?.email || '',
          state: athlete.user?.state || 'National',
          district: athlete.user?.district || '',
          sport: athlete.primarySport,
          overallScore: athlete.benchmarkRadar?.overallScore || 70,
          nationalPercentile: athlete.nationalPercentile || 85.0,
          benchmarkRadar: athlete.benchmarkRadar,
        }));

        return res.status(200).json({
          status: 'success',
          totalAthletes: leaderboard.length,
          data: leaderboard,
        });
      }
    }

    // Fallback to Autonomous Embedded Store
    let data = embeddedStore.athletes.map((ath, idx) => {
      const u = embeddedStore.users.find((user) => user._id === ath.user) || {};
      return {
        rank: idx + 1,
        athleteId: ath.athleteId,
        name: u.name || 'Athlete',
        email: u.email || '',
        state: u.state || 'Maharashtra',
        district: u.district || 'Pune',
        sport: ath.primarySport,
        overallScore: ath.benchmarkRadar.overallScore,
        nationalPercentile: ath.nationalPercentile,
        benchmarkRadar: ath.benchmarkRadar,
      };
    });

    if (sport) {
      data = data.filter((item) =>
        item.sport.toLowerCase().includes(sport.toLowerCase())
      );
    }

    res.status(200).json({
      status: 'success',
      totalAthletes: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add coach scouting feedback / shortlist an athlete
// @route   POST /api/scouts/feedback
// @access  Private (Coach/Scout)
const submitCoachFeedback = async (req, res, next) => {
  try {
    const { athleteId, rating, scoutingStatus, notes, drillRecommendations } = req.body;

    if (!athleteId || !notes) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide athleteId and feedback notes.',
      });
    }

    let feedbackDoc;
    if (mongoose.connection.readyState === 1) {
      feedbackDoc = await CoachFeedback.create({
        coach: req.user?._id || 'coach_01',
        athlete: athleteId,
        rating: Number(rating) || 4,
        scoutingStatus: scoutingStatus || 'Shortlisted',
        notes,
        drillRecommendations: drillRecommendations || [],
      });
    } else {
      feedbackDoc = {
        _id: `fb_${Date.now()}`,
        coach: req.user?._id || 'coach_01',
        athlete: athleteId,
        rating: Number(rating) || 4,
        scoutingStatus: scoutingStatus || 'Shortlisted',
        notes,
        drillRecommendations: drillRecommendations || [],
        createdAt: new Date(),
      };
      embeddedStore.coachFeedbacks.push(feedbackDoc);
    }

    res.status(201).json({
      status: 'success',
      message: 'Scouting feedback submitted successfully! 🌟',
      data: feedbackDoc,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNationalLeaderboard,
  submitCoachFeedback,
};
