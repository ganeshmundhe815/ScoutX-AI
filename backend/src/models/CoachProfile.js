const mongoose = require('mongoose');

const ALLOWED_COACH_LICENSES = [
  'AFC D License',
  'AFC D / AIFF D',
  'AFC C License',
  'AFC C / UEFA C',
  'AFC B License',
  'AFC B / UEFA B',
  'AFC A License',
  'AFC A / UEFA A',
  'Grassroots',
  'PRO License',
  'AFC Pro Diploma',
  'Independent Scout',
];

const normalizeCoachLicense = (input) => {
  if (!input || typeof input !== 'string') {
    return 'AFC D License';
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return 'AFC D License';
  }

  // Exact match
  if (ALLOWED_COACH_LICENSES.includes(trimmed)) {
    return trimmed;
  }

  // Case-insensitive exact match
  const lower = trimmed.toLowerCase();
  const matched = ALLOWED_COACH_LICENSES.find(
    (lic) => lic.toLowerCase() === lower
  );
  if (matched) return matched;

  // Pattern / variation matching
  if (/^(\s*afc\s*)?d(\s*license)?$/i.test(trimmed) || /aiff\s*d/i.test(trimmed)) {
    return 'AFC D License';
  }
  if (/^(\s*afc\s*)?c(\s*license)?$/i.test(trimmed) || /uefa\s*c/i.test(trimmed)) {
    return 'AFC C / UEFA C';
  }
  if (/^(\s*afc\s*)?b(\s*license)?$/i.test(trimmed) || /uefa\s*b/i.test(trimmed)) {
    return 'AFC B / UEFA B';
  }
  if (/^(\s*afc\s*)?a(\s*license)?$/i.test(trimmed) || /uefa\s*a/i.test(trimmed)) {
    return 'AFC A / UEFA A';
  }
  if (/pro/i.test(trimmed)) {
    return 'PRO License';
  }
  if (/grassroot/i.test(trimmed)) {
    return 'Grassroots';
  }
  if (/scout/i.test(trimmed)) {
    return 'Independent Scout';
  }

  return 'AFC D License';
};

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
      enum: ALLOWED_COACH_LICENSES,
      default: 'AFC D License',
      set: normalizeCoachLicense,
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

const CoachProfile = mongoose.model('CoachProfile', coachProfileSchema);
CoachProfile.ALLOWED_COACH_LICENSES = ALLOWED_COACH_LICENSES;
CoachProfile.normalizeCoachLicense = normalizeCoachLicense;

module.exports = CoachProfile;
