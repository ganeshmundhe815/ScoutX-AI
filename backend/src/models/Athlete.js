const mongoose = require('mongoose');

// 2. Athletes Collection Schema
const athleteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    athleteId: {
      type: String,
      unique: true,
      default: () => `SAI-${Math.floor(100000 + Math.random() * 900000)}`,
    },
    dateOfBirth: {
      type: Date,
    },
    age: {
      type: Number,
      required: [true, 'Please enter athlete age'],
      min: [8, 'Minimum age is 8'],
      max: [50, 'Maximum age is 50'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    heightCm: {
      type: Number,
      default: null,
    },
    weightKg: {
      type: Number,
      default: null,
    },
    primarySport: {
      type: String,
      default: 'Athletics',
    },
    clubOrAcademy: {
      type: String,
      default: '',
    },
    // Standardized Khelo India / SAI 5-Axis Radar Benchmark (0 - 100)
    benchmarkRadar: {
      power: { type: Number, default: 0 },       // Jump test
      endurance: { type: Number, default: 0 },   // Push-up test
      strength: { type: Number, default: 0 },    // Squat test
      agility: { type: Number, default: 0 },     // Shuttle test
      flexibility: { type: Number, default: 0 }, // Reach test
      overallScore: { type: Number, default: 0 },
    },
    nationalPercentile: {
      type: Number,
      default: 0, // e.g. 94.2
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

module.exports = mongoose.model('Athlete', athleteSchema);
