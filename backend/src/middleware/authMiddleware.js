const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify token with secret key
      const secret = process.env.JWT_SECRET || 'scoutx_secret_key_sih2025_safe_token';
      const decoded = jwt.verify(token, secret);

      // Find user from decoded token payload (excluding password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          status: 'fail',
          message: 'User belonging to this token no longer exists.',
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
      message: 'Access denied: No authentication token provided in header.',
    });
  }
};

module.exports = { protect };
