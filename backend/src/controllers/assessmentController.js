const Athlete = require('../models/Athlete');
const PerformanceResult = require('../models/PerformanceResult');
const VideoRecord = require('../models/VideoRecord');
const { sendVideoToAI } = require('../services/aiService');

// @desc    Upload sports performance video and run AI analysis
// @route   POST /api/assessments/analyze
// @access  Private (Athlete)
const uploadAndAnalyzeDrill = async (req, res, next) => {
  try {
    const drillType = req.body.drillType || 'squat';
    const videoFile = req.file;

    // Video path on disk
    const videoPath = videoFile ? videoFile.path : '';

    console.log(`🎬 [Assessment] Processing ${drillType.toUpperCase()} drill for athlete: ${req.user.name}`);

    // 1. Call Python AI Computer Vision Service
    const aiResult = await sendVideoToAI(videoPath, drillType);

    // 2. Fetch or Create Athlete Profile
    let athlete = await Athlete.findOne({ user: req.user._id });
    if (!athlete) {
      athlete = await Athlete.create({
        user: req.user._id,
        age: 18,
        gender: 'male',
        primarySport: 'Athletics',
      });
    }

    // 3. Save Performance Result in MongoDB
    const performance = await PerformanceResult.create({
      athlete: athlete._id,
      drillType,
      videoUrl: videoFile ? `/uploads/${videoFile.filename}` : '',
      metrics: {
        totalReps: aiResult.metrics?.totalReps || 0,
        validReps: aiResult.metrics?.validReps || 0,
        invalidReps: aiResult.metrics?.invalidReps || 0,
        formAccuracyPercentage: aiResult.metrics?.formAccuracyPercentage || 85.0,
        jumpHeightCm: aiResult.metrics?.jumpHeightCm || 0.0,
        flightTimeMs: aiResult.metrics?.flightTimeMs || 0,
        biomechanicalFaults: aiResult.metrics?.biomechanicalFaults || [],
      },
      saiStandardScore: aiResult.saiNormScore || 80.0,
      nationalPercentile: Math.min(99.4, roundNumber(65.0 + (aiResult.saiNormScore || 80.0) * 0.32)),
    });

    // 4. Save Video Record in MongoDB
    if (videoFile) {
      await VideoRecord.create({
        athlete: athlete._id,
        performanceResult: performance._id,
        drillType,
        videoUrl: `/uploads/${videoFile.filename}`,
        fileSizeMB: roundNumber(videoFile.size / (1024 * 1024)),
        status: 'completed',
        integrityCheck: {
          isSinglePerson: true,
          confidenceScore: aiResult.aiConfidenceScore || 0.95,
        },
      });
    }

    // 5. Update Athlete's 5-Axis Radar Benchmark Scores
    const saiScore = aiResult.saiNormScore || 80.0;
    if (drillType === 'squat') {
      athlete.benchmarkRadar.strength = saiScore;
    } else if (drillType === 'pushup') {
      athlete.benchmarkRadar.endurance = saiScore;
    } else if (drillType === 'jump') {
      athlete.benchmarkRadar.power = saiScore;
    }

    // Recalculate Overall Radar Score
    const radar = athlete.benchmarkRadar;
    const scores = [radar.power || 75, radar.endurance || 80, radar.strength || 70, radar.agility || 72, radar.flexibility || 65];
    const overall = roundNumber(scores.reduce((a, b) => a + b, 0) / scores.length);
    athlete.benchmarkRadar.overallScore = overall;
    athlete.nationalPercentile = Math.min(99.5, roundNumber(60.0 + overall * 0.38));
    await athlete.save();

    // 6. Respond with Full Talent Scorecard
    res.status(201).json({
      status: 'success',
      message: `AI Assessment completed for ${drillType.toUpperCase()}! 🏆`,
      data: {
        assessmentId: performance._id,
        drillType,
        metrics: performance.metrics,
        saiStandardScore: performance.saiStandardScore,
        nationalPercentile: performance.nationalPercentile,
        updatedRadarScorecard: [
          { subject: 'Explosive Power', score: athlete.benchmarkRadar.power, fullMark: 100 },
          { subject: 'Muscular Endurance', score: athlete.benchmarkRadar.endurance, fullMark: 100 },
          { subject: 'Lower-Body Strength', score: athlete.benchmarkRadar.strength, fullMark: 100 },
          { subject: 'Agility & Speed', score: athlete.benchmarkRadar.agility, fullMark: 100 },
          { subject: 'Flexibility', score: athlete.benchmarkRadar.flexibility, fullMark: 100 },
        ],
        overallAthleticScore: athlete.benchmarkRadar.overallScore,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all assessments for the logged-in athlete
// @route   GET /api/assessments
// @access  Private (Athlete)
const getMyAssessments = async (req, res, next) => {
  try {
    const athlete = await Athlete.findOne({ user: req.user._id });
    if (!athlete) {
      return res.status(200).json({ status: 'success', count: 0, data: [] });
    }

    const assessments = await PerformanceResult.find({ athlete: athlete._id }).sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', count: assessments.length, data: assessments });
  } catch (error) {
    next(error);
  }
};

const roundNumber = (num) => Math.round(num * 10) / 10;

module.exports = {
  uploadAndAnalyzeDrill,
  getMyAssessments,
};
