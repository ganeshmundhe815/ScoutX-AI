const mongoose = require('mongoose');

// 6. Coach Feedback Collection Schema
const coachFeedbackSchema = new mongoose.Schema(
  {
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    athlete: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Athlete',
      required: true,
    },
    performanceResult: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PerformanceResult',
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
      required: true,
    },
    scoutingStatus: {
      type: String,
      enum: ['Under Review', 'Shortlisted', 'Invited to Trials', 'Scholarship Candidate', 'Needs Conditioning'],
      default: 'Under Review',
    },
    notes: {
      type: String,
      required: [true, 'Please provide feedback notes'],
      trim: true,
    },
    drillRecommendations: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CoachFeedback', coachFeedbackSchema);
