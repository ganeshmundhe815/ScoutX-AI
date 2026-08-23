const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema(
  {
    athlete: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AthleteProfile',
      required: true,
    },
    drillType: {
      type: String,
      enum: ['squat', 'pushup', 'jump'],
      required: true,
    },
    videoUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'completed',
    },
    // AI Computer Vision Results
    metrics: {
      totalReps: { type: Number, default: 0 },
      validReps: { type: Number, default: 0 },
      invalidReps: { type: Number, default: 0 },
      formAccuracyPercentage: { type: Number, default: 0 }, // 0 to 100%
      jumpHeightCm: { type: Number, default: 0 },
      flightTimeMs: { type: Number, default: 0 },
      durationSeconds: { type: Number, default: 0 },
      keyBiomechanicalErrors: [{ type: String }], // e.g. ["Knee angle did not reach 90 degrees", "Excessive torso lean"]
    },
    saiNormScore: {
      type: Number,
      default: 0, // Age & gender normalized score out of 100
    },
    aiConfidenceScore: {
      type: Number,
      default: 0.95,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Assessment', assessmentSchema);
