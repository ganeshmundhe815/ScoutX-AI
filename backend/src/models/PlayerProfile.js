const mongoose = require('mongoose');

const playerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    playerId: {
      type: String,
      unique: true,
      default: () => `FB-${Math.floor(100000 + Math.random() * 900000)}`,
    },
    age: {
      type: Number,
      default: 17,
      min: 8,
      max: 45,
    },
    position: {
      type: String,
      enum: [
        'Goalkeeper',
        'Centre Back',
        'Full Back',
        'Defensive Midfielder',
        'Central Midfielder',
        'Attacking Midfielder',
        'Winger',
        'Striker',
      ],
      default: 'Striker',
    },
    preferredFoot: {
      type: String,
      enum: ['Left', 'Right', 'Both'],
      default: 'Right',
    },
    heightCm: {
      type: Number,
      default: 175,
    },
    weightKg: {
      type: Number,
      default: 68,
    },
    clubOrTeam: {
      type: String,
      default: 'Free Agent / Grassroots Academy',
      trim: true,
    },
    profilePhotoUrl: {
      type: String,
      default: '',
    },
    // Football Performance Scores (0 - 100)
    overallScore: {
      type: Number,
      default: 75.0,
      min: 0,
      max: 100,
    },
    dribblingScore: {
      type: Number,
      default: 75.0,
      min: 0,
      max: 100,
    },
    shootingScore: {
      type: Number,
      default: 75.0,
      min: 0,
      max: 100,
    },
    ballControlScore: {
      type: Number,
      default: 75.0,
      min: 0,
      max: 100,
    },
    shotAccuracy: {
      type: Number,
      default: 70.0,
      min: 0,
      max: 100,
    },
    estimatedPower: {
      type: Number,
      default: 72.0,
      min: 0,
      max: 100,
    },
    nationalPercentile: {
      type: Number,
      default: 80.0,
    },
    assessmentCount: {
      type: Number,
      default: 0,
    },
    achievements: [
      {
        title: String,
        description: String,
        badgeUrl: String,
        unlockedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for high-performance coach search & filtering
playerProfileSchema.index({ position: 1, overallScore: -1 });
playerProfileSchema.index({ dribblingScore: -1, shootingScore: -1 });

module.exports = mongoose.model('PlayerProfile', playerProfileSchema);
