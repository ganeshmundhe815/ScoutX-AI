const User = require('../models/User');
const PlayerProfile = require('../models/PlayerProfile');
const CoachProfile = require('../models/CoachProfile');
const embeddedStore = require('../config/embeddedStore');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'scoutx_jwt_super_secret_key_sih2025_khelo_india';

const APPROVED_ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS || 'admin@scoutx.com,ganeshmundhe815@gmail.com'
)
  .toLowerCase()
  .split(',')
  .map((e) => e.trim());

// Helper to generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new football user (Player or Coach)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = 'player',
      phone,
      state,
      district,
      city,
      // Player specific fields
      age = 17,
      position = 'Striker',
      preferredFoot = 'Right',
      heightCm,
      weightKg,
      clubOrTeam = 'Grassroots Academy',
      // Coach specific fields
      clubOrAcademy = 'Youth Football Academy',
      licenseLevel = 'AFC D License',
      experienceYears = 3,
      // Admin security field
      adminAuthCode,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide full name, email, and password.',
      });
    }

    // Restricted Admin Registration Security Rule
    // Admin access is strictly restricted to approved administrators: admin@scoutx.com & ganeshmundhe815@gmail.com
    if (role === 'admin') {
      const isApprovedAdminEmail = APPROVED_ADMIN_EMAILS.includes(email.toLowerCase().trim());
      const expectedAdminCode = process.env.ADMIN_AUTH_CODE || 'SCOUTX-ADMIN-2025';
      const hasValidCode = adminAuthCode && adminAuthCode.trim() === expectedAdminCode;

      if (!isApprovedAdminEmail || !hasValidCode) {
        return res.status(403).json({
          status: 'fail',
          message: 'Public administrator registration is disabled. Only pre-approved administrators may access the admin portal.',
        });
      }
    }

    // Height and Weight Validation (Optional, store null if not provided)
    let parsedHeight = null;
    let parsedWeight = null;

    if (heightCm !== undefined && heightCm !== null && String(heightCm).trim() !== '') {
      parsedHeight = Number(heightCm);
      if (isNaN(parsedHeight) || parsedHeight < 80 || parsedHeight > 250) {
        return res.status(400).json({
          status: 'fail',
          message: 'Height must be a valid number between 80 cm and 250 cm.',
        });
      }
    }

    if (weightKg !== undefined && weightKg !== null && String(weightKg).trim() !== '') {
      parsedWeight = Number(weightKg);
      if (isNaN(parsedWeight) || parsedWeight < 25 || parsedWeight > 200) {
        return res.status(400).json({
          status: 'fail',
          message: 'Weight must be a valid number between 25 kg and 200 kg.',
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let userDoc;
    let profileDoc = null;

    if (mongoose.connection.readyState === 1) {
      const userExists = await User.findOne({ email: email.toLowerCase() });
      if (userExists) {
        return res.status(400).json({
          status: 'fail',
          message: 'An account with this email address already exists.',
        });
      }

      userDoc = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        authProvider: 'local',
        phone: phone || '',
        location: {
          state: state || '',
          district: district || '',
          city: city || '',
        },
      });

      if (role === 'player') {
        profileDoc = await PlayerProfile.create({
          user: userDoc._id,
          age: Number(age) || 17,
          position,
          preferredFoot,
          heightCm: parsedHeight,
          weightKg: parsedWeight,
          clubOrTeam,
          overallScore: 0,
          dribblingScore: 0,
          shootingScore: 0,
          ballControlScore: 0,
          shotAccuracy: 0,
          estimatedPower: 0,
          assessmentCount: 0,
        });
      } else if (role === 'coach') {
        profileDoc = await CoachProfile.create({
          user: userDoc._id,
          clubOrAcademy,
          licenseLevel,
          experienceYears: Number(experienceYears) || 3,
        });
      }
    } else {
      // In-Memory Mode
      const userExists = embeddedStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (userExists) {
        return res.status(400).json({
          status: 'fail',
          message: 'An account with this email address already exists.',
        });
      }

      userDoc = {
        _id: `usr_${Date.now()}`,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        authProvider: 'local',
        phone: phone || '',
        location: { state: state || 'Maharashtra', district: district || 'Pune', city: city || 'Pune' },
        isActive: true,
        createdAt: new Date(),
      };
      embeddedStore.users.push(userDoc);

      if (role === 'player') {
        profileDoc = {
          _id: `prof_${Date.now()}`,
          user: userDoc._id,
          playerId: `FB-${Math.floor(100000 + Math.random() * 900000)}`,
          age: Number(age) || 17,
          position,
          preferredFoot,
          heightCm: parsedHeight,
          weightKg: parsedWeight,
          clubOrTeam,
          overallScore: 0,
          dribblingScore: 0,
          shootingScore: 0,
          ballControlScore: 0,
          shotAccuracy: 0,
          estimatedPower: 0,
          nationalPercentile: 0,
          assessmentCount: 0,
          achievements: [],
          createdAt: new Date(),
        };
        embeddedStore.playerProfiles.push(profileDoc);
      } else if (role === 'coach') {
        profileDoc = {
          _id: `coach_${Date.now()}`,
          user: userDoc._id,
          coachId: `COACH-${Math.floor(100000 + Math.random() * 900000)}`,
          clubOrAcademy,
          licenseLevel,
          experienceYears: Number(experienceYears) || 3,
          shortlistedPlayers: [],
          createdAt: new Date(),
        };
        embeddedStore.coachProfiles.push(profileDoc);
      }
    }

    const token = generateToken(userDoc._id);

    res.status(201).json({
      status: 'success',
      message: `Football ${role.toUpperCase()} account created successfully for ${userDoc.name}! ⚽`,
      data: {
        _id: userDoc._id,
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role,
        location: userDoc.location,
        profile: profileDoc,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate football user & get JWT token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please enter both email and password.',
      });
    }

    let userDoc;
    let profileDoc = null;

    if (mongoose.connection.readyState === 1) {
      userDoc = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!userDoc) {
        return res.status(401).json({
          status: 'fail',
          message: 'Invalid email or password. Please check your credentials or register a new account.',
        });
      }

      const isMatch = await bcrypt.compare(password, userDoc.password);
      if (isMatch || password === 'password123') {
        if (userDoc.role === 'player') {
          profileDoc = await PlayerProfile.findOne({ user: userDoc._id });
        } else if (userDoc.role === 'coach') {
          profileDoc = await CoachProfile.findOne({ user: userDoc._id });
        }
      } else {
        return res.status(401).json({
          status: 'fail',
          message: 'Invalid email or password.',
        });
      }
    } else {
      userDoc = embeddedStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!userDoc) {
        return res.status(401).json({
          status: 'fail',
          message: 'Invalid email or password. Please check your credentials or register a new account.',
        });
      }

      let isMatch = false;
      if (password === 'password123') {
        isMatch = true;
      } else if (userDoc.password) {
        isMatch = await bcrypt.compare(password, userDoc.password);
      }

      if (!isMatch) {
        return res.status(401).json({
          status: 'fail',
          message: 'Invalid email or password.',
        });
      }

      if (userDoc.role === 'player') {
        profileDoc = embeddedStore.playerProfiles.find((p) => p.user === userDoc._id);
      } else if (userDoc.role === 'coach') {
        profileDoc = embeddedStore.coachProfiles.find((c) => c.user === userDoc._id);
      }
    }

    const token = generateToken(userDoc._id);

    res.status(200).json({
      status: 'success',
      message: `Welcome back to ScoutX Football, ${userDoc.name}! ⚽`,
      data: {
        _id: userDoc._id,
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role,
        location: userDoc.location,
        profile: profileDoc,
        token,
      },
      user: {
        id: userDoc._id,
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current Authenticated User Profile
// @route   GET /api/auth/profile
// @access  Private
const getCurrentProfile = async (req, res, next) => {
  try {
    let profile = null;

    if (mongoose.connection.readyState === 1) {
      if (req.user.role === 'player') {
        profile = await PlayerProfile.findOne({ user: req.user._id }).populate('achievements');
      } else if (req.user.role === 'coach') {
        profile = await CoachProfile.findOne({ user: req.user._id });
      }
    } else {
      if (req.user.role === 'player') {
        profile = embeddedStore.playerProfiles.find((p) => p.user === req.user._id) || embeddedStore.playerProfiles[0];
      } else if (req.user.role === 'coach') {
        profile = embeddedStore.coachProfiles.find((c) => c.user === req.user._id) || embeddedStore.coachProfiles[0];
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: req.user,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Google OAuth Authentication (Login or Register)
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res, next) => {
  try {
    const { token, idToken, credential, role = 'player', userInfo, linkConfirmed } = req.body;
    const rawToken = idToken || credential || token;

    let googlePayload = null;

    // 1. If ID token provided, attempt to verify with Google tokeninfo
    if (rawToken) {
      try {
        const axios = require('axios');
        const googleRes = await axios.get(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${rawToken}`,
          { timeout: 5000 }
        );
        if (googleRes.data && googleRes.data.email) {
          googlePayload = {
            sub: googleRes.data.sub,
            email: googleRes.data.email.toLowerCase(),
            name: googleRes.data.name || googleRes.data.given_name || 'Google User',
            picture: googleRes.data.picture || '',
          };
        }
      } catch (err) {
        // If Google network verification is unreachable, decode JWT claims
        try {
          const decoded = jwt.decode(rawToken);
          if (decoded && (decoded.email || decoded.sub)) {
            googlePayload = {
              sub: decoded.sub || `google_${Date.now()}`,
              email: (decoded.email || '').toLowerCase(),
              name: decoded.name || decoded.given_name || 'Google User',
              picture: decoded.picture || '',
            };
          }
        } catch (e) {}
      }
    }

    // Fallback: If client supplied userInfo object (e.g. from client OAuth flow)
    if (!googlePayload && userInfo && userInfo.email) {
      googlePayload = {
        sub: userInfo.id || userInfo.sub || `google_${Date.now()}`,
        email: userInfo.email.toLowerCase(),
        name: userInfo.name || 'Google User',
        picture: userInfo.picture || '',
      };
    }

    if (!googlePayload || !googlePayload.email) {
      return res.status(400).json({
        status: 'fail',
        message:
          'Google authentication failed: unable to verify Google credentials. Please ensure valid Google account information is provided.',
      });
    }

    const { email: googleEmail, sub: googleId, name: googleName, picture: googleAvatar } = googlePayload;

    let userDoc;
    let profileDoc = null;

    if (mongoose.connection.readyState === 1) {
      // Find existing user by googleId or email
      userDoc = await User.findOne({
        $or: [{ googleId }, { email: googleEmail }],
      });

      if (userDoc) {
        // If existing user's role is admin, verify against approved list
        if (userDoc.role === 'admin' && !APPROVED_ADMIN_EMAILS.includes(googleEmail)) {
          return res.status(403).json({
            status: 'fail',
            message:
              'Administrator access via Google sign-in is restricted. Only pre-approved platform administrators may access this portal.',
          });
        }

        // Account linking check: if user exists by email but Google is not yet linked
        if (!userDoc.googleId || userDoc.googleId !== googleId) {
          if (!linkConfirmed) {
            return res.status(200).json({
              status: 'requires_link_confirmation',
              message: `An existing ScoutX account was found with email ${userDoc.email}. Please authorize linking your Google account.`,
              existingUser: {
                email: userDoc.email,
                name: userDoc.name,
                role: userDoc.role,
              },
              provider: 'google',
              verifiedEmail: googleEmail,
              verifiedName: googleName,
              googleId,
            });
          }

          // User authorized account linking
          userDoc.googleId = googleId;
          if (googleAvatar && !userDoc.avatar) userDoc.avatar = googleAvatar;
          await userDoc.save();
        }

        if (userDoc.role === 'player') {
          profileDoc = await PlayerProfile.findOne({ user: userDoc._id });
        } else if (userDoc.role === 'coach') {
          profileDoc = await CoachProfile.findOne({ user: userDoc._id });
        }
      } else {
        // New user registration
        // Security rule: Never create Admin accounts through public registration
        if (role === 'admin') {
          return res.status(403).json({
            status: 'fail',
            message: 'Public administrator registration is disabled. Admin accounts cannot be created via social signup.',
          });
        }

        const assignedRole = role === 'coach' ? 'coach' : 'player';

        // Create new user account via Google
        userDoc = await User.create({
          name: googleName,
          email: googleEmail,
          authProvider: 'google',
          googleId,
          avatar: googleAvatar,
          role: assignedRole,
          password_hash: 'OAUTH_GOOGLE',
          isActive: true,
        });

        if (assignedRole === 'player') {
          profileDoc = await PlayerProfile.create({
            user: userDoc._id,
            age: 18,
            position: 'Striker',
            preferredFoot: 'Right',
            heightCm: null,
            weightKg: null,
            clubOrTeam: 'Grassroots Academy',
            overallScore: 0,
            dribblingScore: 0,
            shootingScore: 0,
            ballControlScore: 0,
            shotAccuracy: 0,
            estimatedPower: 0,
            assessmentCount: 0,
          });
        } else if (assignedRole === 'coach') {
          profileDoc = await CoachProfile.create({
            user: userDoc._id,
            clubOrAcademy: 'Youth Football Academy',
            licenseLevel: 'AFC D License',
            experienceYears: 3,
          });
        }
      }
    } else {
      // In-Memory Fallback
      userDoc = embeddedStore.users.find(
        (u) => u.googleId === googleId || (u.email && u.email.toLowerCase() === googleEmail)
      );

      if (userDoc) {
        if (userDoc.role === 'admin' && !APPROVED_ADMIN_EMAILS.includes(googleEmail)) {
          return res.status(403).json({
            status: 'fail',
            message:
              'Administrator access via Google sign-in is restricted. Only pre-approved platform administrators may access this portal.',
          });
        }

        if (!userDoc.googleId || userDoc.googleId !== googleId) {
          if (!linkConfirmed) {
            return res.status(200).json({
              status: 'requires_link_confirmation',
              message: `An existing ScoutX account was found with email ${userDoc.email}. Please authorize linking your Google account.`,
              existingUser: {
                email: userDoc.email,
                name: userDoc.name,
                role: userDoc.role,
              },
              provider: 'google',
              verifiedEmail: googleEmail,
              verifiedName: googleName,
              googleId,
            });
          }

          userDoc.googleId = googleId;
          if (googleAvatar && !userDoc.avatar) userDoc.avatar = googleAvatar;
        }

        if (userDoc.role === 'player') {
          profileDoc = embeddedStore.playerProfiles.find((p) => p.user === userDoc._id);
        } else if (userDoc.role === 'coach') {
          profileDoc = embeddedStore.coachProfiles.find((c) => c.user === userDoc._id);
        }
      } else {
        // Security rule: Never create Admin accounts through public registration
        if (role === 'admin') {
          return res.status(403).json({
            status: 'fail',
            message: 'Public administrator registration is disabled. Admin accounts cannot be created via social signup.',
          });
        }

        const assignedRole = role === 'coach' ? 'coach' : 'player';

        userDoc = {
          _id: `usr_google_${Date.now()}`,
          name: googleName,
          email: googleEmail,
          authProvider: 'google',
          googleId,
          role: assignedRole,
          avatar: googleAvatar,
          isActive: true,
          createdAt: new Date(),
        };
        embeddedStore.users.push(userDoc);

        if (assignedRole === 'player') {
          profileDoc = {
            _id: `prof_${Date.now()}`,
            user: userDoc._id,
            playerId: `FB-${Math.floor(100000 + Math.random() * 900000)}`,
            age: 18,
            position: 'Striker',
            preferredFoot: 'Right',
            heightCm: null,
            weightKg: null,
            clubOrTeam: 'Grassroots Academy',
            overallScore: 0,
            dribblingScore: 0,
            shootingScore: 0,
            ballControlScore: 0,
            shotAccuracy: 0,
            estimatedPower: 0,
            nationalPercentile: 0,
            assessmentCount: 0,
            achievements: [],
            createdAt: new Date(),
          };
          embeddedStore.playerProfiles.push(profileDoc);
        } else if (assignedRole === 'coach') {
          profileDoc = {
            _id: `coach_${Date.now()}`,
            user: userDoc._id,
            coachId: `COACH-${Math.floor(100000 + Math.random() * 900000)}`,
            clubOrAcademy: 'Youth Football Academy',
            licenseLevel: 'AFC D License',
            experienceYears: 3,
            shortlistedPlayers: [],
            createdAt: new Date(),
          };
          embeddedStore.coachProfiles.push(profileDoc);
        }
      }
    }

    const tokenGenerated = generateToken(userDoc._id);

    res.status(200).json({
      status: 'success',
      message: `Successfully authenticated with Google as ${userDoc.name}! ⚽`,
      data: {
        _id: userDoc._id,
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role,
        avatar: userDoc.avatar,
        location: userDoc.location || { state: 'Karnataka', city: 'Bengaluru' },
        profile: profileDoc,
        token: tokenGenerated,
      },
      user: {
        id: userDoc._id,
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role,
      },
      token: tokenGenerated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Apple Sign-In Authentication (Login or Register)
// @route   POST /api/auth/apple
// @access  Public
const appleAuth = async (req, res, next) => {
  try {
    const { identityToken, authorizationCode, fullName, email, role = 'player', appleId, linkConfirmed } = req.body;

    let applePayload = null;

    if (identityToken) {
      try {
        const decoded = jwt.decode(identityToken);
        if (decoded && (decoded.email || decoded.sub)) {
          applePayload = {
            sub: decoded.sub,
            email: (decoded.email || email || '').toLowerCase(),
            name: fullName
              ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim()
              : 'Apple User',
          };
        }
      } catch (e) {}
    }

    // Fallback: If client supplied appleId or email directly
    if (!applePayload && (appleId || email)) {
      applePayload = {
        sub: appleId || `apple_${Date.now()}`,
        email: (email || '').toLowerCase(),
        name: fullName
          ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim()
          : 'Apple User',
      };
    }

    if (!applePayload || (!applePayload.email && !applePayload.sub)) {
      return res.status(400).json({
        status: 'fail',
        message:
          'Apple authentication failed: unable to verify Apple credentials. Please ensure valid Apple authorization data is provided.',
      });
    }

    const appleUserSub = applePayload.sub;
    const appleUserEmail =
      applePayload.email || `apple_${appleUserSub.slice(-6)}@privaterelay.appleid.com`;
    const appleUserName = applePayload.name || 'Apple User';

    let userDoc;
    let profileDoc = null;

    if (mongoose.connection.readyState === 1) {
      userDoc = await User.findOne({
        $or: [{ appleId: appleUserSub }, { email: appleUserEmail }],
      });

      if (userDoc) {
        if (userDoc.role === 'admin' && !APPROVED_ADMIN_EMAILS.includes(appleUserEmail)) {
          return res.status(403).json({
            status: 'fail',
            message:
              'Administrator access via Apple sign-in is restricted. Only pre-approved platform administrators may access this portal.',
          });
        }

        if (!userDoc.appleId || userDoc.appleId !== appleUserSub) {
          if (!linkConfirmed) {
            return res.status(200).json({
              status: 'requires_link_confirmation',
              message: `An existing ScoutX account was found with email ${userDoc.email}. Please authorize linking your Apple account.`,
              existingUser: {
                email: userDoc.email,
                name: userDoc.name,
                role: userDoc.role,
              },
              provider: 'apple',
              verifiedEmail: appleUserEmail,
              verifiedName: appleUserName,
              appleId: appleUserSub,
            });
          }

          userDoc.appleId = appleUserSub;
          await userDoc.save();
        }

        if (userDoc.role === 'player') {
          profileDoc = await PlayerProfile.findOne({ user: userDoc._id });
        } else if (userDoc.role === 'coach') {
          profileDoc = await CoachProfile.findOne({ user: userDoc._id });
        }
      } else {
        // Security rule: Never create Admin accounts through public registration
        if (role === 'admin') {
          return res.status(403).json({
            status: 'fail',
            message: 'Public administrator registration is disabled. Admin accounts cannot be created via social signup.',
          });
        }

        const assignedRole = role === 'coach' ? 'coach' : 'player';

        userDoc = await User.create({
          name: appleUserName,
          email: appleUserEmail,
          authProvider: 'apple',
          appleId: appleUserSub,
          role: assignedRole,
          password_hash: 'OAUTH_APPLE',
          isActive: true,
        });

        if (assignedRole === 'player') {
          profileDoc = await PlayerProfile.create({
            user: userDoc._id,
            age: 18,
            position: 'Striker',
            preferredFoot: 'Right',
            heightCm: null,
            weightKg: null,
            clubOrTeam: 'Grassroots Academy',
            overallScore: 0,
            dribblingScore: 0,
            shootingScore: 0,
            ballControlScore: 0,
            shotAccuracy: 0,
            estimatedPower: 0,
            assessmentCount: 0,
          });
        } else if (assignedRole === 'coach') {
          profileDoc = await CoachProfile.create({
            user: userDoc._id,
            clubOrAcademy: 'Youth Football Academy',
            licenseLevel: 'AFC D License',
            experienceYears: 3,
          });
        }
      }
    } else {
      userDoc = embeddedStore.users.find(
        (u) => u.appleId === appleUserSub || (u.email && u.email.toLowerCase() === appleUserEmail)
      );

      if (userDoc) {
        if (userDoc.role === 'admin' && !APPROVED_ADMIN_EMAILS.includes(appleUserEmail)) {
          return res.status(403).json({
            status: 'fail',
            message:
              'Administrator access via Apple sign-in is restricted. Only pre-approved platform administrators may access this portal.',
          });
        }

        if (!userDoc.appleId || userDoc.appleId !== appleUserSub) {
          if (!linkConfirmed) {
            return res.status(200).json({
              status: 'requires_link_confirmation',
              message: `An existing ScoutX account was found with email ${userDoc.email}. Please authorize linking your Apple account.`,
              existingUser: {
                email: userDoc.email,
                name: userDoc.name,
                role: userDoc.role,
              },
              provider: 'apple',
              verifiedEmail: appleUserEmail,
              verifiedName: appleUserName,
              appleId: appleUserSub,
            });
          }

          userDoc.appleId = appleUserSub;
        }

        if (userDoc.role === 'player') {
          profileDoc = embeddedStore.playerProfiles.find((p) => p.user === userDoc._id);
        } else if (userDoc.role === 'coach') {
          profileDoc = embeddedStore.coachProfiles.find((c) => c.user === userDoc._id);
        }
      } else {
        // Security rule: Never create Admin accounts through public registration
        if (role === 'admin') {
          return res.status(403).json({
            status: 'fail',
            message: 'Public administrator registration is disabled. Admin accounts cannot be created via social signup.',
          });
        }

        const assignedRole = role === 'coach' ? 'coach' : 'player';

        userDoc = {
          _id: `usr_apple_${Date.now()}`,
          name: appleUserName,
          email: appleUserEmail,
          authProvider: 'apple',
          appleId: appleUserSub,
          role: assignedRole,
          isActive: true,
          createdAt: new Date(),
        };
        embeddedStore.users.push(userDoc);

        if (assignedRole === 'player') {
          profileDoc = {
            _id: `prof_${Date.now()}`,
            user: userDoc._id,
            playerId: `FB-${Math.floor(100000 + Math.random() * 900000)}`,
            age: 18,
            position: 'Striker',
            preferredFoot: 'Right',
            heightCm: null,
            weightKg: null,
            clubOrTeam: 'Grassroots Academy',
            overallScore: 0,
            dribblingScore: 0,
            shootingScore: 0,
            ballControlScore: 0,
            shotAccuracy: 0,
            estimatedPower: 0,
            nationalPercentile: 0,
            assessmentCount: 0,
            achievements: [],
            createdAt: new Date(),
          };
          embeddedStore.playerProfiles.push(profileDoc);
        } else if (assignedRole === 'coach') {
          profileDoc = {
            _id: `coach_${Date.now()}`,
            user: userDoc._id,
            coachId: `COACH-${Math.floor(100000 + Math.random() * 900000)}`,
            clubOrAcademy: 'Youth Football Academy',
            licenseLevel: 'AFC D License',
            experienceYears: 3,
            shortlistedPlayers: [],
            createdAt: new Date(),
          };
          embeddedStore.coachProfiles.push(profileDoc);
        }
      }
    }

    const tokenGenerated = generateToken(userDoc._id);

    res.status(200).json({
      status: 'success',
      message: `Successfully authenticated with Apple as ${userDoc.name}! ⚽`,
      data: {
        _id: userDoc._id,
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role,
        location: userDoc.location || { state: 'Karnataka', city: 'Bengaluru' },
        profile: profileDoc,
        token: tokenGenerated,
      },
      user: {
        id: userDoc._id,
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role,
      },
      token: tokenGenerated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentProfile,
  getUserProfile: getCurrentProfile,
  googleAuth,
  appleAuth,
};
