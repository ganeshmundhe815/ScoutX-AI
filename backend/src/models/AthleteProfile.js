const mongoose = require('mongoose');

const athleteProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    age: {
      type: Number,
      required: true,
      min: [8, 'Age must be at least 8'],
      max: [50, 'Age must be under 50'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    heightCm: {
      type: Number,
      default: 0,
    },
    weightKg: {
      type: Number,
      default: 0,
    },
    primarySport: {
      type: String,
      default: 'General Athletics',
    },
    clubOrSchool: {
      type: String,
      default: '',
    },
    // Standardized Khelo India / SAI Benchmark Radar Scores (0 to 100)
    benchmarkScores: {
      powerScore: { type: Number, default: 0 },       // Measured via Vertical Jump
      enduranceScore: { type: Number, default: 0 },   // Measured via Push-ups
      strengthScore: { type: Number, default: 0 },    // Measured via Squats
      agilityScore: { type: Number, default: 0 },     // Measured via Shuttle Run
      flexibilityScore: { type: Number, default: 0 }, // Measured via Sit & Reach
      overallRadarScore: { type: Number, default: 0 },
    },
    nationalPercentile: {
      type: Number,
      default: 0, // e.g., 92.5th percentile
    },
    stateRank: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AthleteProfile', athleteProfileSchema);
