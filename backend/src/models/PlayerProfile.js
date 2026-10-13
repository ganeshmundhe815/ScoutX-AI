const mongoose = require('mongoose');

/**
 * ER Diagram Entity: ATHLETE (PlayerProfile)
 * Attributes: PK athlete_id, FK user_id, age, playing_position, city
 * Relationships:
 *   USER (1) --- 0..1 (profile) ---> ATHLETE
 *   ATHLETE (1) --- N (has) ---> ASSESSMENT
 *   ATHLETE (1) --- N (shortlisted) ---> SHORTLIST
 */
const playerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    playerId: {
      type: String,
      unique: true,
      default: () => `FB-${Math.floor(100000 + Math.random() * 900000)}`,
    },
    athlete_id: {
      type: String,
      default: function () {
        return this.playerId || `ATH-${Math.floor(100000 + Math.random() * 900000)}`;
      },
    },
    age: {
      type: Number,
      default: 18,
      min: 8,
      max: 45,
    },
    position: {
      type: String,
      enum: [
        'Goalkeeper',
        'Defender',
        'Centre Back',
        'Full Back',
        'Defensive Midfielder',
        'Central Midfielder',
        'Midfielder',
        'Attacking Midfielder',
        'Winger',
        'Striker',
      ],
      default: 'Striker',
    },
    playing_position: {
      type: String,
      default: 'Striker',
    },
    city: {
      type: String,
      default: 'Bengaluru',
      trim: true,
    },
    preferredFoot: {
      type: String,
      enum: ['Left', 'Right', 'Both'],
      default: 'Right',
    },
    heightCm: {
      type: Number,
      default: null,
    },
    weightKg: {
      type: Number,
      default: null,
    },
    clubOrTeam: {
      type: String,
      default: 'Bengaluru Youth FC',
      trim: true,
    },
    profilePhotoUrl: {
      type: String,
      default: '',
    },
    // Football Performance Scores (0 - 100)
    overallScore: {
      type: Number,
      default: 85.0,
      min: 0,
      max: 100,
    },
    dribblingScore: {
      type: Number,
      default: 85.0,
      min: 0,
      max: 100,
    },
    shootingScore: {
      type: Number,
      default: 85.0,
      min: 0,
      max: 100,
    },
    ballControlScore: {
      type: Number,
      default: 85.0,
      min: 0,
      max: 100,
    },
    shotAccuracy: {
      type: Number,
      default: 82.0,
      min: 0,
      max: 100,
    },
    estimatedPower: {
      type: Number,
      default: 84.0,
      min: 0,
      max: 100,
    },
    // ER Diagram SCORE Summary Attributes (0 - 100)
    scoreSummary: {
      technique: { type: Number, default: 88.0 },
      consistency: { type: Number, default: 86.0 },
      accuracy: { type: Number, default: 87.0 },
      endurance: { type: Number, default: 85.0 },
      overall: { type: Number, default: 86.5 },
    },
    nationalPercentile: {
      type: Number,
      default: 92.0,
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

playerProfileSchema.pre('save', function (next) {
  if (this.user && !this.user_id) this.user_id = this.user;
  if (this.playerId && !this.athlete_id) this.athlete_id = this.playerId;
  if (this.position) this.playing_position = this.position;
  if (typeof next === 'function') next();
});

// Indexes for high-performance coach search & filtering
playerProfileSchema.index({ position: 1, overallScore: -1 });
playerProfileSchema.index({ dribblingScore: -1, shootingScore: -1 });

module.exports = mongoose.model('PlayerProfile', playerProfileSchema);
