const mongoose = require('mongoose');

/**
 * ER Diagram Entity: METRIC
 * Relationship: ASSESSMENT (1) --- contains ---> (N) METRIC
 * Attributes: PK metric_id, FK assessment_id, metric_name, value
 */
const metricSchema = new mongoose.Schema(
  {
    metric_id: {
      type: String,
      unique: true,
      default: () => `MET-${Math.floor(100000 + Math.random() * 900000)}`,
    },
    assessment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FootballAssessment',
      required: true,
      index: true,
    },
    metric_name: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    unit: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Metric', metricSchema);
