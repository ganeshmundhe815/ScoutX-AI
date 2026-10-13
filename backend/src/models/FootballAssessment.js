const mongoose = require('mongoose');

/**
 * ER Diagram Entity: ASSESSMENT (FootballAssessment)
 * Attributes: PK assessment_id, FK athlete_id, drill_type, video_url, status
 * Relationships:
 *   ATHLETE (1) --- N (has) ---> ASSESSMENT
 *   ASSESSMENT (1) --- N (contains) ---> METRIC
 *   ASSESSMENT (1) --- 1 (produces) ---> SCORE
 */
const footballAssessmentSchema = new mongoose.Schema(
  {
    assessment_id: {
      type: String,
      unique: true,
      default: () => `ASM-${Math.floor(100000 + Math.random() * 900000)}`,
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlayerProfile',
      required: true,
    },
    athlete_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlayerProfile',
    },
    drillType: {
      type: String,
      enum: ['dribbling', 'shooting', 'ball_control'],
      required: true,
    },
    drill_type: {
      type: String,
      enum: ['dribbling', 'shooting', 'ball_control'],
    },
    videoUrl: {
      type: String,
      default: '',
    },
    video_url: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'completed',
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

    // ER Diagram 1:1 SCORE snapshot (also persisted in Score collection)
    score: {
      score_id: { type: String, default: () => `SCR-${Math.floor(100000 + Math.random() * 900000)}` },
      technique: { type: Number, default: 85 },
      consistency: { type: Number, default: 85 },
      accuracy: { type: Number, default: 85 },
      endurance: { type: Number, default: 85 },
      overall: { type: Number, default: 85 },
    },

    // ER Diagram 1:N METRIC list snapshot (also persisted in Metric collection)
    metricsList: [
      {
        metric_id: String,
        metric_name: String,
        value: mongoose.Schema.Types.Mixed,
        unit: String,
      },
    ],

    // A. Dribbling Specific Metrics
    dribbling: {
      score: { type: Number, default: 0 },
      durationSec: { type: Number, default: 0 },
      ballTouches: { type: Number, default: 0 },
      controlConsistency: { type: Number, default: 0 }, // 0 - 100%
      avgPlayerBallDistance: { type: Number, default: 0 },
      directionChanges: { type: Number, default: 0 },
    },

    // B. Shooting Specific Metrics
    shooting: {
      score: { type: Number, default: 0 },
      shotsCount: { type: Number, default: 0 },
      onTargetAccuracy: { type: Number, default: 0 }, // 0 - 100%
      goalsDetected: { type: Number, default: 0 },
      estimatedPower: { type: Number, default: 0 },
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
      default: 0.96,
    },
  },
  {
    timestamps: true,
  }
);

footballAssessmentSchema.pre('save', function (next) {
  if (this.player && !this.athlete_id) this.athlete_id = this.player;
  if (this.drillType && !this.drill_type) this.drill_type = this.drillType;
  if (this.videoUrl && !this.video_url) this.video_url = this.videoUrl;
  if (typeof next === 'function') next();
});

module.exports = mongoose.model('FootballAssessment', footballAssessmentSchema);
