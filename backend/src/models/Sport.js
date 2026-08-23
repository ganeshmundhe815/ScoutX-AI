const mongoose = require('mongoose');

// 3. Sports Collection Schema
const sportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Sport name is required'],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Track & Field', 'Team Sports', 'Racquet Sports', 'Combat Sports', 'Individual'],
      default: 'Track & Field',
    },
    description: {
      type: String,
      default: '',
    },
    // Required physical fitness focus areas
    priorityMetrics: [
      {
        metricName: { type: String }, // e.g. "power", "agility", "endurance"
        weightage: { type: Number, default: 1.0 },
      },
    ],
    recommendedDrills: [{ type: String }], // ['squat', 'pushup', 'jump']
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Sport', sportSchema);
