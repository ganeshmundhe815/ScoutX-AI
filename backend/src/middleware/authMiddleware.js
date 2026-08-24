const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const embeddedStore = require('../config/embeddedStore');

const JWT_SECRET = process.env.JWT_SECRET || 'scoutx_jwt_super_secret_key_sih2025_khelo_india';

/**
 * Protect middleware: Verifies JWT token from Authorization header
 * and attaches authenticated user document to req.user
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      if (mongoose.connection.readyState === 1) {
        req.user = await User.findById(decoded.id).select('-password');
      } else {
        req.user = embeddedStore.users.find((u) => u._id === decoded.id) || embeddedStore.users[0];
      }

      if (!req.user) {
        return res.status(401).json({
          status: 'fail',
          message: 'The user belonging to this token no longer exists.',
        });
      }

      if (req.user.isActive === false) {
        return res.status(403).json({
          status: 'fail',
          message: 'Your account has been deactivated. Please contact admin.',
        });
      }

      next();
    } catch (error) {
      console.error(`❌ [Auth Error]: ${error.message}`);
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid or expired authentication token. Please log in again.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'Access denied: No authentication token provided.',
    });
  }
};

/**
 * Role authorization middleware: Restricts routes to specific roles (e.g. 'coach', 'admin')
 * @param  {...string} roles - Allowed roles
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: `Forbidden: Role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorizeRoles,
};
