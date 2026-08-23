const mongoose = require('mongoose');

// 5. Video Records Collection Schema
const videoRecordSchema = new mongoose.Schema(
  {
    athlete: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Athlete',
      required: true,
    },
    performanceResult: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PerformanceResult',
    },
    drillType: {
      type: String,
      enum: ['squat', 'pushup', 'jump'],
      required: true,
    },
    videoUrl: {
      type: String,
      required: [true, 'Video storage URL or path is required'],
    },
    fileSizeMB: {
      type: Number,
      default: 0,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    fps: {
      type: Number,
      default: 30,
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing_cv', 'completed', 'failed'],
      default: 'uploaded',
    },
    // Anti-fraud video integrity verification
    integrityCheck: {
      isSinglePerson: { type: Boolean, default: true },
      confidenceScore: { type: Number, default: 0.95 },
      flaggedReason: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('VideoRecord', videoRecordSchema);
