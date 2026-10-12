const mongoose = require('mongoose');
const PlayerProfile = require('../models/PlayerProfile');
const CoachProfile = require('../models/CoachProfile');
const User = require('../models/User');
const embeddedStore = require('../config/embeddedStore');

// @desc    Search and filter football players with advanced criteria
// @route   GET /api/scouts/players
// @access  Private (Coach or Admin)
const searchAndFilterPlayers = async (req, res, next) => {
  try {
    const {
      search,
      position,
      preferredFoot,
      minAge,
      maxAge,
      minScore,
      minDribbling,
      minShooting,
      minControl,
      state,
      sortBy = 'overallScore',
      order = 'desc',
    } = req.query;

    let players = [];

    if (mongoose.connection.readyState === 1) {
      const query = {};

      if (position) {
        query.position = new RegExp(position, 'i');
      }

      if (preferredFoot) {
        query.preferredFoot = preferredFoot;
      }

      if (minAge || maxAge) {
        query.age = {};
        if (minAge) query.age.$gte = Number(minAge);
        if (maxAge) query.age.$lte = Number(maxAge);
      }

      if (minScore) query.overallScore = { $gte: Number(minScore) };
      if (minDribbling) query.dribblingScore = { $gte: Number(minDribbling) };
      if (minShooting) query.shootingScore = { $gte: Number(minShooting) };
      if (minControl) query.ballControlScore = { $gte: Number(minControl) };

      const sortOption = {};
      sortOption[sortBy] = order === 'asc' ? 1 : -1;

      players = await PlayerProfile.find(query)
        .populate('user', 'name email phone location')
        .sort(sortOption)
        .limit(50);

      // Filter by name or state if provided
      if (search) {
        players = players.filter(
          (p) =>
            p.user &&
            (p.user.name.toLowerCase().includes(search.toLowerCase()) ||
             p.playerId.toLowerCase().includes(search.toLowerCase()))
        );
      }

      if (state) {
        players = players.filter(
          (p) =>
            p.user &&
            p.user.location &&
            p.user.location.state.toLowerCase().includes(state.toLowerCase())
        );
      }
    } else {
      // In-Memory Fallback
      players = embeddedStore.playerProfiles.map((p) => {
        const u = embeddedStore.users.find((user) => user._id === p.user) || {
          name: 'Sunil Chhetri Jr',
          email: 'player@scoutx.com',
          location: { state: 'Karnataka', city: 'Bengaluru' },
        };
        return { ...p, user: u };
      });

      if (position) {
        players = players.filter((p) => p.position.toLowerCase().includes(position.toLowerCase()));
      }
      if (preferredFoot) {
        players = players.filter((p) => p.preferredFoot === preferredFoot);
      }
      if (minScore) {
        players = players.filter((p) => p.overallScore >= Number(minScore));
      }
      if (search) {
        players = players.filter((p) => p.user.name.toLowerCase().includes(search.toLowerCase()));
      }
    }

    res.status(200).json({
      status: 'success',
      results: players.length,
      data: players,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Shortlist a football player with scouting notes
// @route   POST /api/scouts/shortlist
// @access  Private (Coach)
const shortlistPlayer = async (req, res, next) => {
  try {
    const { playerId, notes = 'High potential prospect' } = req.body;

    if (!playerId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Player ID is required for shortlisting.',
      });
    }

    let coachDoc;
    if (mongoose.connection.readyState === 1) {
      coachDoc = await CoachProfile.findOne({ user: req.user._id });
      if (!coachDoc) {
        coachDoc = await CoachProfile.create({ user: req.user._id });
      }

      const alreadyShortlisted = coachDoc.shortlistedPlayers.some(
        (sp) => sp.player.toString() === playerId
      );

      if (!alreadyShortlisted) {
        coachDoc.shortlistedPlayers.push({ player: playerId, notes });
        await coachDoc.save();
      }
    } else {
      coachDoc =
        embeddedStore.coachProfiles.find((c) => c.user === req.user._id) ||
        embeddedStore.coachProfiles[0];
      coachDoc.shortlistedPlayers.push({ player: playerId, notes, addedAt: new Date() });
    }

    res.status(200).json({
      status: 'success',
      message: 'Player successfully added to your Coach Shortlist! ⚽📋',
      data: coachDoc.shortlistedPlayers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Coach Shortlist
// @route   GET /api/scouts/shortlist
// @access  Private (Coach)
const getShortlist = async (req, res, next) => {
  try {
    let shortlist = [];

    if (mongoose.connection.readyState === 1) {
      const coachDoc = await CoachProfile.findOne({ user: req.user._id }).populate({
        path: 'shortlistedPlayers.player',
        populate: { path: 'user', select: 'name email phone location' },
      });
      shortlist = coachDoc ? coachDoc.shortlistedPlayers : [];
    } else {
      const coachDoc =
        embeddedStore.coachProfiles.find((c) => c.user === req.user._id) ||
        embeddedStore.coachProfiles[0];
      shortlist = coachDoc ? coachDoc.shortlistedPlayers : [];
    }

    res.status(200).json({
      status: 'success',
      results: shortlist.length,
      data: shortlist,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove player from Coach Shortlist
// @route   DELETE /api/scouts/shortlist/:playerId
// @access  Private (Coach)
const removeFromShortlist = async (req, res, next) => {
  try {
    const { playerId } = req.params;

    let coachDoc;
    if (mongoose.connection.readyState === 1) {
      coachDoc = await CoachProfile.findOne({ user: req.user._id });
      if (coachDoc) {
        coachDoc.shortlistedPlayers = coachDoc.shortlistedPlayers.filter(
          (sp) => sp.player.toString() !== playerId && sp._id.toString() !== playerId
        );
        await coachDoc.save();
      }
    } else {
      coachDoc =
        embeddedStore.coachProfiles.find((c) => c.user === req.user._id) ||
        embeddedStore.coachProfiles[0];
      coachDoc.shortlistedPlayers = (coachDoc.shortlistedPlayers || []).filter(
        (sp) => sp.player !== playerId && sp.player?._id !== playerId && sp._id !== playerId
      );
    }

    res.status(200).json({
      status: 'success',
      message: 'Player removed from Coach Shortlist.',
      data: coachDoc ? coachDoc.shortlistedPlayers : [],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get national football discovery leaderboard
// @route   GET /api/scouts/leaderboard
// @access  Public
const getLeaderboard = async (req, res, next) => {
  try {
    let leaderboard = [];

    if (mongoose.connection.readyState === 1) {
      const topPlayers = await PlayerProfile.find({})
        .populate('user', 'name location')
        .sort({ overallScore: -1 })
        .limit(20);

      leaderboard = topPlayers.map((p, idx) => ({
        rank: idx + 1,
        athleteId: p.playerId,
        name: p.user ? p.user.name : 'Football Athlete',
        state: p.user && p.user.location ? p.user.location.state : 'Maharashtra',
        sport: p.position,
        position: p.position,
        preferredFoot: p.preferredFoot,
        overallScore: p.overallScore,
        dribbling: p.dribblingScore,
        shooting: p.shootingScore,
        ballControl: p.ballControlScore,
        nationalPercentile: p.nationalPercentile,
      }));
    } else {
      leaderboard = embeddedStore.playerProfiles.map((p, idx) => {
        const u = embeddedStore.users.find((usr) => usr._id === p.user) || {
          name: 'Sunil Chhetri Jr',
          location: { state: 'Karnataka' },
        };
        return {
          rank: idx + 1,
          athleteId: p.playerId,
          name: u.name,
          state: u.location.state,
          sport: p.position,
          position: p.position,
          preferredFoot: p.preferredFoot,
          overallScore: p.overallScore,
          dribbling: p.dribblingScore,
          shooting: p.shootingScore,
          ballControl: p.ballControlScore,
          nationalPercentile: p.nationalPercentile,
        };
      });
    }

    res.status(200).json({
      status: 'success',
      results: leaderboard.length,
      data: leaderboard,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get famous football star benchmarks (TheSportsDB API + ScoutX Pro Catalog)
// @route   GET /api/scouts/benchmarks
// @access  Public
const getFamousBenchmarks = async (req, res, next) => {
  try {
    const benchmarkService = require('../services/benchmarkService');
    const benchmarks = await benchmarkService.getFamousBenchmarks();

    res.status(200).json({
      status: 'success',
      results: benchmarks.length,
      data: benchmarks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get individual star player benchmark details
// @route   GET /api/scouts/benchmarks/:id
// @access  Public
const getBenchmarkDetail = async (req, res, next) => {
  try {
    const benchmarkService = require('../services/benchmarkService');
    const benchmark = benchmarkService.getBenchmarkById(req.params.id);

    if (!benchmark) {
      return res.status(404).json({
        status: 'fail',
        message: 'Benchmark profile not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: benchmark,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchAndFilterPlayers,
  shortlistPlayer,
  getShortlist,
  removeFromShortlist,
  getLeaderboard,
  getFamousBenchmarks,
  getBenchmarkDetail,
};


