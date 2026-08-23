const mongoose = require('mongoose');

// 4. Performance Results Collection Schema
const performanceResultSchema = new mongoose.Schema(
  {
    athlete: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Athlete',
      required: true,
    },
    drillType: {
      type: String,
      enum: ['squat', 'pushup', 'jump'],
      required: true,
    },
    // Extracted Computer Vision Athletic Metrics
    metrics: {
      totalReps: { type: Number, default: 0 },
      validReps: { type: Number, default: 0 },
      invalidReps: { type: Number, default: 0 },
      formAccuracyPercentage: { type: Number, default: 0 }, // 0 to 100%
      jumpHeightCm: { type: Number, default: 0 },
      flightTimeMs: { type: Number, default: 0 },
      drillDurationSeconds: { type: Number, default: 0 },
      biomechanicalFaults: [{ type: String }], // e.g. ["Insufficient squat depth", "Knee valgus"]
    },
    saiStandardScore: {
      type: Number,
      default: 0, // Age & gender normalized score out of 100
    },
    nationalPercentile: {
      type: Number,
      default: 0,
    },
    assessmentDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PerformanceResult', performanceResultSchema);
