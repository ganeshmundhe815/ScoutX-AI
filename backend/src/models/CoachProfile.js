const mongoose = require('mongoose');

/**
 * ER Diagram Entity: COACH (CoachProfile)
 * Attributes: PK coach_id, FK user_id, coach_name / profile, (other fields as required)
 * Relationships:
 *   USER (1) --- 0..1 (profile) ---> COACH
 *   COACH (1) --- N (creates) ---> SHORTLIST
 */
const coachProfileSchema = new mongoose.Schema(
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
    coachId: {
      type: String,
      unique: true,
      default: () => `COACH-${Math.floor(100000 + Math.random() * 900000)}`,
    },
    coach_id: {
      type: String,
      default: function () {
        return this.coachId || `COACH-${Math.floor(100000 + Math.random() * 900000)}`;
      },
    },
    coach_name: {
      type: String,
      default: 'Coach Ranjan Patil',
      trim: true,
    },
    clubOrAcademy: {
      type: String,
      default: 'Mumbai City Youth Academy',
      trim: true,
    },
    licenseLevel: {
      type: String,
      enum: ['Grassroots', 'AFC C / UEFA C', 'AFC B / UEFA B', 'AFC A / UEFA A', 'PRO License', 'Independent Scout'],
      default: 'AFC A / UEFA A',
    },
    experienceYears: {
      type: Number,
      default: 8,
    },
    scoutingRegions: [
      {
        type: String,
      },
    ],
    bio: {
      type: String,
      default: 'Head Youth Scout looking for sharp wingers and clinical strikers.',
    },
    shortlistedPlayers: [
      {
        player: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'PlayerProfile',
        },
        athlete_id: {
          type: String,
        },
        notes: String,
        note: String,
        addedAt: { type: Date, default: Date.now },
        created_at: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

coachProfileSchema.pre('save', function (next) {
  if (this.user && !this.user_id) this.user_id = this.user;
  if (this.coachId && !this.coach_id) this.coach_id = this.coachId;
  if (typeof next === 'function') next();
});

module.exports = mongoose.model('CoachProfile', coachProfileSchema);
