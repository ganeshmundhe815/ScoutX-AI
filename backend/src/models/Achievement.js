const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlayerProfile',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Dribbling Master',
        'Sniper (Shooting)',
        'First Touch King',
        'Speed Merchant',
        'Two-Footed Prodigy',
        'Century Club',
        'Rising Star',
      ],
      default: 'Rising Star',
    },
    description: {
      type: String,
      required: true,
    },
    badgeIcon: {
      type: String,
      default: 'trophy',
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Achievement', achievementSchema);
