const mongoose = require('mongoose');

/**
 * ER Diagram Entity: SHORTLIST
 * Relationships:
 *   COACH (1) --- creates ---> (N) SHORTLIST
 *   ATHLETE (1) --- shortlisted ---> (N) SHORTLIST
 * Attributes: FK coach_id, FK athlete_id, note, created_at
 */
const shortlistSchema = new mongoose.Schema(
  {
    shortlist_id: {
      type: String,
      unique: true,
      default: () => `SL-${Math.floor(100000 + Math.random() * 900000)}`,
    },
    coach_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoachProfile',
      required: true,
      index: true,
    },
    athlete_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlayerProfile',
      required: true,
      index: true,
    },
    note: {
      type: String,
      default: 'High potential football talent identified via ScoutX AI.',
      trim: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Shortlist', shortlistSchema);
