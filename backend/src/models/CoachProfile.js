const mongoose = require('mongoose');

const coachProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    coachId: {
      type: String,
      unique: true,
      default: () => `COACH-${Math.floor(100000 + Math.random() * 900000)}`,
    },
    clubOrAcademy: {
      type: String,
      default: 'Football Scouting Network',
      trim: true,
    },
    licenseLevel: {
      type: String,
      enum: ['Grassroots', 'AFC C / UEFA C', 'AFC B / UEFA B', 'AFC A / UEFA A', 'PRO License', 'Independent Scout'],
      default: 'AFC C / UEFA C',
    },
    experienceYears: {
      type: Number,
      default: 5,
    },
    scoutingRegions: [
      {
        type: String,
      },
    ],
    bio: {
      type: String,
      default: '',
    },
    shortlistedPlayers: [
      {
        player: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'PlayerProfile',
        },
        notes: String,
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CoachProfile', coachProfileSchema);
