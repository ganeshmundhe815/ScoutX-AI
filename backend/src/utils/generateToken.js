const jwt = require('jsonwebtoken');

/**
 * Generates a signed JSON Web Token (JWT) containing the user's ID
 * @param {string} userId - Mongoose User ObjectId
 * @returns {string} Signed JWT token string
 */
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'scoutx_jwt_super_secret_key_sih2025_khelo_india';
  return jwt.sign({ id: userId }, secret, {
    expiresIn: '30d', // Token valid for 30 days
  });
};

module.exports = generateToken;
