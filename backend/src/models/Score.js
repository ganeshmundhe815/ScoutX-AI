const mongoose = require('mongoose');

/**
 * ER Diagram Entity: SCORE
 * Relationship: ASSESSMENT (1) --- produces ---> (1) SCORE
 * Attributes: PK score_id, FK assessment_id, technique, consistency, accuracy, endurance, overall
 */
const scoreSchema = new mongoose.Schema(
  {
    score_id: {
      type: String,
      unique: true,
      default: () => `SCR-${Math.floor(100000 + Math.random() * 900000)}`,
    },
    assessment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FootballAssessment',
      required: true,
      unique: true,
    },
    technique: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 85,
    },
    consistency: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 85,
    },
    accuracy: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 85,
    },
    endurance: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 85,
    },
    overall: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 85,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Score', scoreSchema);
