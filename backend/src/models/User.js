const mongoose = require('mongoose');

/**
 * ER Diagram Entity: USER
 * Attributes: PK user_id, name, email, password_hash, role
 * Relationships:
 *   USER (1) --- 0..1 (profile) ---> ATHLETE
 *   USER (1) --- 0..1 (profile) ---> COACH
 */
const userSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      unique: true,
      default: () => `USR-${Math.floor(100000 + Math.random() * 900000)}`,
    },
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide a valid email address'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.authProvider || this.authProvider === 'local';
      },
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    password_hash: {
      type: String,
      select: false,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'apple'],
      default: 'local',
    },
    googleId: {
      type: String,
      default: null,
    },
    appleId: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['player', 'athlete', 'coach', 'admin'],
      default: 'player',
    },
    phone: {
      type: String,
      default: '',
    },
    location: {
      state: { type: String, default: '' },
      district: { type: String, default: '' },
      city: { type: String, default: '' },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', function (next) {
  if (this.password && !this.password_hash) {
    this.password_hash = this.password;
  }
  if (typeof next === 'function') next();
});

module.exports = mongoose.model('User', userSchema);
