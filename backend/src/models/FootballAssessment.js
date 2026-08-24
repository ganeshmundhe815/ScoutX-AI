const mongoose = require('mongoose');

const footballAssessmentSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlayerProfile',
      required: true,
    },
    drillType: {
      type: String,
      enum: ['dribbling', 'shooting', 'ball_control'],
      required: true,
    },
    videoUrl: {
      type: String,
      default: '',
    },
    annotatedVideoUrl: {
      type: String,
      default: '',
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    // A. Dribbling Specific Metrics
    dribbling: {
      score: { type: Number, default: 0 },
      durationSec: { type: Number, default: 0 },
      ballTouches: { type: Number, default: 0 },
      controlConsistency: { type: Number, default: 0 }, // 0 - 100%
      avgPlayerBallDistance: { type: Number, default: 0 }, // in meters or normalized pixels
      directionChanges: { type: Number, default: 0 },
    },

    // B. Shooting Specific Metrics
    shooting: {
      score: { type: Number, default: 0 },
      shotsCount: { type: Number, default: 0 },
      onTargetAccuracy: { type: Number, default: 0 }, // 0 - 100%
      goalsDetected: { type: Number, default: 0 },
      estimatedPower: { type: Number, default: 0 }, // 0 - 100 relative index
      shotDirection: { type: String, default: 'Centre' },
    },

    // C. Ball Control Specific Metrics
    ballControl: {
      score: { type: Number, default: 0 },
      touchesCount: { type: Number, default: 0 },
      playerBallDistance: { type: Number, default: 0 },
      controlConsistency: { type: Number, default: 0 },
      reboundControlScore: { type: Number, default: 0 },
    },

    // D. Foot Usage
    footUsage: {
      leftFootTouches: { type: Number, default: 0 },
      rightFootTouches: { type: Number, default: 0 },
      leftFootPercentage: { type: Number, default: 0 },
      rightFootPercentage: { type: Number, default: 0 },
      preferredFoot: { type: String, default: 'Right' },
    },

    // AI Feedback & Biomechanical Coaching Notes
    feedback: [
      {
        type: String,
      },
    ],

    confidenceScore: {
      type: Number,
      default: 0.94,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FootballAssessment', footballAssessmentSchema);
