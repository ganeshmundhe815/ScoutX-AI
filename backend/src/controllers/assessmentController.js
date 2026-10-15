const FootballAssessment = require('../models/FootballAssessment');
const PlayerProfile = require('../models/PlayerProfile');
const { sendVideoToAI } = require('../services/aiService');
const {
  calculateMetricsAndScores,
  persistScoreAndMetricsToDB,
} = require('../services/scoringReportService');
const embeddedStore = require('../config/embeddedStore');
const mongoose = require('mongoose');

// @desc    Upload & Analyze Football Drill Video (DFD: P1 -> P2 -> D1 -> P3 -> P4 -> D2 -> P5)
// @route   POST /api/assessments/analyze
// @access  Private (Player)
const uploadAndAnalyzeDrill = async (req, res, next) => {
  try {
    const drillType = req.body.drillType || req.body.drill_type || 'dribbling';
    const preferredFoot = req.body.preferredFoot || req.user?.preferredFoot || 'Right';
    const videoFile = req.file;
    const videoPath = videoFile ? videoFile.path : '';
    const relativeVideoUrl = videoFile
      ? `/uploads/${videoFile.filename}`
      : `/uploads/football_${drillType}_clip.mp4`;
    const playerName = req.user ? req.user.name : 'Football Player';

    console.log(
      `⚽ [P2 -> D1 -> P3 AI Engine] Ingesting ${drillType.toUpperCase()} video: ${
        videoPath || 'Direct Stream'
      } for ${playerName}`
    );

    // 1. P3 — FOOTBALL AI ANALYSIS: Send video to Python AI Computer Vision Engine (Port 8000)
    const aiResult = await sendVideoToAI(videoPath, drillType, preferredFoot);

    if (!aiResult || aiResult.status === 'unavailable' || aiResult.success === false) {
      let statusCode = 503;
      if (aiResult?.status === 'timeout') {
        statusCode = 504; // Gateway Timeout
      } else if (aiResult?.status === 'invalid_format' || aiResult?.status === 'invalid_input') {
        statusCode = 400; // Bad Request
      } else if (aiResult?.status === 'unreachable') {
        statusCode = 503; // Service Unavailable
      }

      return res.status(statusCode).json({
        status: 'fail',
        serviceStatus: aiResult?.status || 'unavailable',
        message:
          aiResult?.message ||
          'AI Computer Vision analysis service is unavailable. Real video assessment could not be processed.',
        errorCode: aiResult?.errorCode || null,
        drillType,
      });
    }


    // 2. P4 — SCORING & REPORTS: Calculate ER Diagram METRIC (1:N) & SCORE (1:1) entities
    const {
      dribblingData,
      shootingData,
      ballControlData,
      footUsageData,
      scoreEntity,
      metricsEntities,
      feedbackList,
      overallScore,
    } = calculateMetricsAndScores(aiResult, drillType);

    const assessmentIdCode = `ASM-${Math.floor(100000 + Math.random() * 900000)}`;
    let playerProfileDoc;
    let assessmentDoc;

    // 3. D2 — MONGODB: Save Assessment, Score (1:1), Metrics (1:N), and Update Athlete Profile
    if (mongoose.connection.readyState === 1) {
      playerProfileDoc = await PlayerProfile.findOne({ user: req.user._id });
      if (!playerProfileDoc) {
        playerProfileDoc = await PlayerProfile.create({
          user: req.user._id,
          user_id: req.user._id,
          age: 18,
          position: 'Striker',
          playing_position: 'Striker',
          city: req.user.location?.city || 'Bengaluru',
          preferredFoot: footUsageData.preferredFoot,
        });
      }

      assessmentDoc = await FootballAssessment.create({
        assessment_id: assessmentIdCode,
        player: playerProfileDoc._id,
        athlete_id: playerProfileDoc._id,
        drillType,
        drill_type: drillType,
        status: 'completed',
        overallScore: Math.round(overallScore),
        videoUrl: relativeVideoUrl,
        video_url: relativeVideoUrl,
        annotatedVideoUrl: aiResult.processedVideoPath || '',
        score: scoreEntity,
        metricsList: metricsEntities,
        dribbling: dribblingData,
        shooting: shootingData,
        ballControl: ballControlData,
        footUsage: footUsageData,
        feedback: feedbackList,
        confidenceScore: aiResult.aiConfidenceScore || 0.96,
      });


      // Persist standalone ER Diagram SCORE (1:1) & METRIC (1:N) documents
      await persistScoreAndMetricsToDB(assessmentDoc._id, scoreEntity, metricsEntities);

      if (drillType === 'dribbling') {
        playerProfileDoc.dribblingScore = dribblingData.score;
      } else if (drillType === 'shooting') {
        playerProfileDoc.shootingScore = shootingData.score;
        playerProfileDoc.shotAccuracy = shootingData.onTargetAccuracy;
        playerProfileDoc.estimatedPower = shootingData.estimatedPower;
      } else if (drillType === 'ball_control') {
        playerProfileDoc.ballControlScore = ballControlData.score;
      }

      playerProfileDoc.scoreSummary = {
        technique: scoreEntity.technique,
        consistency: scoreEntity.consistency,
        accuracy: scoreEntity.accuracy,
        endurance: scoreEntity.endurance,
        overall: scoreEntity.overall,
      };
      playerProfileDoc.assessmentCount += 1;

      const scores = [
        playerProfileDoc.dribblingScore || 80,
        playerProfileDoc.shootingScore || 80,
        playerProfileDoc.ballControlScore || 80,
      ];
      playerProfileDoc.overallScore = Math.round(
        scores.reduce((a, b) => a + b, 0) / scores.length
      );
      playerProfileDoc.nationalPercentile = Math.min(
        99.4,
        Math.round(60.0 + playerProfileDoc.overallScore * 0.4)
      );
      await playerProfileDoc.save();
    } else {
      // In-Memory Mode with Full ER Entity Mirror
      playerProfileDoc =
        embeddedStore.playerProfiles.find((p) => p.user === req.user?._id) ||
        embeddedStore.playerProfiles[0];

      if (drillType === 'dribbling')
        playerProfileDoc.dribblingScore = Math.round(dribblingData.score);
      if (drillType === 'shooting')
        playerProfileDoc.shootingScore = Math.round(shootingData.score);
      if (drillType === 'ball_control')
        playerProfileDoc.ballControlScore = Math.round(ballControlData.score);

      playerProfileDoc.scoreSummary = {
        technique: scoreEntity.technique,
        consistency: scoreEntity.consistency,
        accuracy: scoreEntity.accuracy,
        endurance: scoreEntity.endurance,
        overall: scoreEntity.overall,
      };

      const scores = [
        playerProfileDoc.dribblingScore || 84,
        playerProfileDoc.shootingScore || 84,
        playerProfileDoc.ballControlScore || 84,
      ];
      playerProfileDoc.overallScore = Math.round(
        scores.reduce((a, b) => a + b, 0) / scores.length
      );
      playerProfileDoc.nationalPercentile = Math.min(
        99.4,
        Math.round(60.0 + playerProfileDoc.overallScore * 0.4)
      );
      playerProfileDoc.assessmentCount = (playerProfileDoc.assessmentCount || 1) + 1;

      const scoreWithFk = { ...scoreEntity, assessment_id: assessmentIdCode };
      const metricsWithFk = metricsEntities.map((m) => ({
        ...m,
        assessment_id: assessmentIdCode,
      }));

      embeddedStore.scores.push(scoreWithFk);
      embeddedStore.metrics.push(...metricsWithFk);

      assessmentDoc = {
        _id: `assess_${Date.now()}`,
        assessment_id: assessmentIdCode,
        player: playerProfileDoc._id,
        athlete_id: playerProfileDoc.athlete_id || playerProfileDoc.playerId,
        drillType,
        drill_type: drillType,
        videoUrl: relativeVideoUrl,
        video_url: relativeVideoUrl,
        annotatedVideoUrl: aiResult.processedVideoPath || '',
        status: 'completed',
        overallScore: Math.round(overallScore),
        score: scoreWithFk,
        metricsList: metricsWithFk,
        dribbling: dribblingData,
        shooting: shootingData,
        ballControl: ballControlData,
        footUsage: footUsageData,
        feedback: feedbackList,
        confidenceScore: aiResult.aiConfidenceScore || 0.96,
        createdAt: new Date(),
      };

      embeddedStore.footballAssessments.unshift(assessmentDoc);
    }

    res.status(201).json({
      status: 'success',
      message: `AI Football Analysis & P4 Scoring completed for ${drillType.toUpperCase()}! ⚽🏆`,
      data: {
        assessmentId: assessmentDoc._id,
        assessment_id: assessmentDoc.assessment_id || assessmentIdCode,
        athlete_id: playerProfileDoc.athlete_id || playerProfileDoc.playerId,
        drillType,
        drill_type: drillType,
        video_url: assessmentDoc.video_url || assessmentDoc.videoUrl,
        status: 'completed',
        overallScore: assessmentDoc.overallScore,
        score: scoreEntity,
        metricsList: metricsEntities,
        metrics: {
          dribbling: dribblingData,
          shooting: shootingData,
          ballControl: ballControlData,
          footUsage: footUsageData,
        },
        feedback: feedbackList,
        updatedPlayerProfile: {
          athlete_id: playerProfileDoc.athlete_id || playerProfileDoc.playerId,
          overallScore: playerProfileDoc.overallScore,
          dribblingScore: playerProfileDoc.dribblingScore,
          shootingScore: playerProfileDoc.shootingScore,
          ballControlScore: playerProfileDoc.ballControlScore,
          scoreSummary: playerProfileDoc.scoreSummary,
          nationalPercentile: playerProfileDoc.nationalPercentile,
          assessmentCount: playerProfileDoc.assessmentCount,
        },
      },
    });
  } catch (error) {
    console.error(`[Assessment Error]: ${error.message}`);
    next(error);
  }
};

// @desc    Get All Assessments for Current Player (P5 — Role-Based Features: Player results & history)
// @route   GET /api/assessments
// @access  Private (Player)
const getPlayerAssessments = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const profile = await PlayerProfile.findOne({ user: req.user._id });
      if (!profile) {
        return res.status(200).json({ status: 'success', count: 0, data: [] });
      }
      const assessments = await FootballAssessment.find({ player: profile._id }).sort({
        createdAt: -1,
      });
      return res.status(200).json({
        status: 'success',
        count: assessments.length,
        data: assessments,
      });
    }

    // In-memory mode: filter by current authenticated athlete
    const playerProf = embeddedStore.playerProfiles.find(
      (p) => p.user === req.user?._id || p.user_id === req.user?._id
    );
    if (!playerProf) {
      return res.status(200).json({ status: 'success', count: 0, data: [] });
    }
    const athleteId = playerProf.athlete_id || playerProf.playerId;
    const playerAssessments = embeddedStore.footballAssessments.filter(
      (a) => a.athlete_id === athleteId || a.player === playerProf._id || a.player === playerProf
    );
    res.status(200).json({
      status: 'success',
      count: playerAssessments.length,
      data: playerAssessments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Run 1-Tap Demo Assessment based on a Famous Football Star benchmark drill
// @route   POST /api/assessments/demo-sample
// @access  Public
const runDemoSampleAssessment = async (req, res, next) => {
  try {
    const { starId = 'star_chhetri', drillType = 'shooting' } = req.body;
    const benchmarkService = require('../services/benchmarkService');
    const result = benchmarkService.createDemoAssessment(starId, drillType);
    const { scoreEntity, metricsEntities } = calculateMetricsAndScores(result, drillType);

    res.status(200).json({
      status: 'success',
      data: {
        ...result,
        assessment_id: `ASM-DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
        drill_type: drillType,
        status: 'completed',
        score: scoreEntity,
        metricsList: metricsEntities,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadAndAnalyzeDrill,
  getPlayerAssessments,
  getMyAssessments: getPlayerAssessments,
  runDemoSampleAssessment,
};
