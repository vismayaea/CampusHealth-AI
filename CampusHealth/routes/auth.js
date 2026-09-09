const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const requireDatabase = require('../middleware/requireDatabase');

const router = express.Router();
router.use(requireDatabase);

const ACCESS_TTL = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 7);
const REMEMBER_DAYS = Number(process.env.REMEMBER_ME_DAYS || 30);

const accessSecret = () => process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev-jwt-secret';
const refreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev-refresh-secret';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;
const allowedYears = ['1', '2', '3', '4', '5', '1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Post Graduate', 'PhD'];

function failValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    return true;
  }
  return false;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function publicProfile(user) {
  if (typeof user.getPublicProfile === 'function') return user.getPublicProfile();
  const publicUser = user.toObject ? user.toObject() : { ...user };
  delete publicUser.password;
  delete publicUser.refreshTokens;
  delete publicUser.passwordResetTokenHash;
  delete publicUser.passwordResetOtpHash;
  delete publicUser.passwordResetExpiresAt;
  delete publicUser.passwordResetAttempts;
  return publicUser;
}

function signAccessToken(user) {
  return jwt.sign(
    { userId: String(user._id), type: 'access' },
    accessSecret(),
    { expiresIn: ACCESS_TTL }
  );
}

function signRefreshToken(user, rememberMe = false) {
  const days = rememberMe ? REMEMBER_DAYS : REFRESH_DAYS;
  const tokenId = crypto.randomUUID();
  const token = jwt.sign(
    { userId: String(user._id), tokenId, type: 'refresh' },
    refreshSecret(),
    { expiresIn: `${days}d` }
  );
  return {
    token,
    tokenId,
    expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  };
}

async function issueTokens(user, rememberMe, userAgent) {
  const token = signAccessToken(user);
  const refresh = signRefreshToken(user, rememberMe);
  if (mongoose.connection.readyState !== 1 || typeof user.save !== 'function') {
    throw new Error('Database connection unavailable while issuing tokens');
  }

  user.refreshTokens = (user.refreshTokens || []).filter((entry) => entry.expiresAt > new Date());
  user.refreshTokens.push({
    tokenHash: hashToken(refresh.token),
    expiresAt: refresh.expiresAt,
    userAgent
  });
  user.lastLogin = new Date();
  await user.save();

  return {
    token,
    accessToken: token,
    refreshToken: refresh.token,
    expiresIn: ACCESS_TTL,
    user: publicProfile(user)
  };
}

function buildUserData(body, provider = 'local') {
  const name = String(body.name || `${body.firstName || ''} ${body.lastName || ''}`).trim();
  const [firstName, ...rest] = name.split(/\s+/);
  return {
    name,
    email: normalizeEmail(body.email),
    password: body.password,
    avatar: body.avatar || body.photoURL || body.profilePicture,
    authProvider: provider,
    firebaseUid: body.firebaseUid,
    department: body.department,
    year: body.year || body.yearOfStudy,
    phone: body.phone,
    preferences: {
      preferredLanguage: body.preferredLanguage || body.preferences?.preferredLanguage || 'en',
      ...(body.preferences || {})
    },
    studentId: body.studentId,
    firstName: body.firstName || firstName,
    lastName: body.lastName || rest.join(' ') || 'User',
    yearOfStudy: body.yearOfStudy || body.year,
    preferredLanguage: body.preferredLanguage || body.preferences?.preferredLanguage || 'en',
    role: 'student',
    gender: body.gender,
    dateOfBirth: body.dateOfBirth
  };
}

async function findUserByEmail(email) {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database connection unavailable');
  }
  return User.findOne({ email: normalizeEmail(email) });
}

async function verifyFirebaseIdToken(idToken) {
  if (process.env.NODE_ENV !== 'production' && idToken.startsWith('test-firebase:')) {
    return JSON.parse(Buffer.from(idToken.replace('test-firebase:', ''), 'base64url').toString('utf8'));
  }

  let admin;
  try {
    admin = require('firebase-admin');
  } catch (error) {
    throw new Error('Firebase Admin SDK is not installed');
  }

  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey })
      });
    } else {
      admin.initializeApp();
    }
  }
  return admin.auth().verifyIdToken(idToken);
}

async function sendResetEmail(email, otp, resetToken) {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(resetToken)}`;
  const subject = 'CampusHealth password reset';
  const text = `Your password reset OTP is ${otp}. It expires in 15 minutes.\n\nReset link: ${resetUrl}`;

  if (!process.env.SMTP_HOST) {
    console.warn(`[auth] Password reset for ${email}: OTP=${otp} URL=${resetUrl}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    } : undefined
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'CampusHealth <no-reply@campushealth.local>',
    to: email,
    subject,
    text
  });
}

const passwordRule = () => body('password')
  .matches(strongPassword)
  .withMessage('Password must be 8+ characters and include uppercase, lowercase, number, and symbol');

router.post('/register', [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  passwordRule(),
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('yearOfStudy').optional().isIn(allowedYears).withMessage('Invalid year of study'),
  body('year').optional().isIn(allowedYears).withMessage('Invalid year'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Invalid phone number'),
  body('role').optional().equals('student').withMessage('Role selection is not permitted during public registration.'),
  body('rememberMe').optional().isBoolean().withMessage('Remember Me must be boolean')
], async (req, res) => {
  try {
    if (failValidation(req, res)) return;
    const email = normalizeEmail(req.body.email);
    if (await findUserByEmail(email)) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const userData = buildUserData(req.body, 'local');
    const user = await new User(userData).save();

    const payload = await issueTokens(user, Boolean(req.body.rememberMe), req.headers['user-agent']);
    return res.status(201).json({ message: 'User registered successfully', ...payload });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
});

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  body('rememberMe').optional().isBoolean().withMessage('Remember Me must be boolean')
], async (req, res) => {
  try {
    if (failValidation(req, res)) return;
    const user = await findUserByEmail(req.body.email);
    if (!user || !user.isActive) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({ message: 'Please continue with Google for this account' });
    }

    const isMatch = await user.comparePassword(req.body.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = await issueTokens(user, Boolean(req.body.rememberMe), req.headers['user-agent']);
    return res.json({ message: 'Login successful', ...payload });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

router.post('/google', [
  body('idToken').notEmpty().withMessage('Firebase ID token is required'),
  body('department').optional().trim(),
  body('year').optional().isIn(allowedYears).withMessage('Invalid year'),
  body('rememberMe').optional().isBoolean().withMessage('Remember Me must be boolean')
], async (req, res) => {
  try {
    if (failValidation(req, res)) return;
    const decoded = await verifyFirebaseIdToken(req.body.idToken);
    const email = normalizeEmail(decoded.email);
    if (!email) {
      return res.status(400).json({ message: 'Firebase account does not include an email' });
    }

    let user = await findUserByEmail(email);
    if (!user) {
      const name = decoded.name || email.split('@')[0];
      const userData = buildUserData({
        name,
        email,
        avatar: decoded.picture,
        firebaseUid: decoded.uid,
        department: req.body.department || 'General',
        year: req.body.year,
        preferredLanguage: req.body.preferredLanguage || 'en'
      }, 'google');
      user = await new User(userData).save();
    } else {
      user.authProvider = user.authProvider || 'google';
      user.firebaseUid = user.firebaseUid || decoded.uid;
      user.avatar = user.avatar || decoded.picture;
      user.profilePicture = user.profilePicture || decoded.picture;
      await user.save();
    }

    const payload = await issueTokens(user, req.body.rememberMe !== false, req.headers['user-agent']);
    return res.json({ message: 'Google login successful', ...payload });
  } catch (error) {
    console.error('Google auth error:', error.message);
    return res.status(401).json({ message: 'Google authentication failed' });
  }
});

router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], async (req, res) => {
  try {
    if (failValidation(req, res)) return;
    const decoded = jwt.verify(req.body.refreshToken, refreshSecret());
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database connection unavailable. Session refresh requires persistent storage.' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    const tokenHash = hashToken(req.body.refreshToken);
    const match = user.refreshTokens?.find((entry) => entry.tokenHash === tokenHash && entry.expiresAt > new Date());
    if (!match) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    user.refreshTokens = user.refreshTokens.filter((entry) => entry.tokenHash !== tokenHash && entry.expiresAt > new Date());
    const payload = await issueTokens(user, true, req.headers['user-agent']);
    return res.json({ message: 'Session refreshed', ...payload });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

router.post('/logout', auth, async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      req.user.refreshTokens = (req.user.refreshTokens || []).filter((entry) => entry.tokenHash !== tokenHash);
    } else {
      req.user.refreshTokens = [];
    }
    await req.user.save();
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Logout failed' });
  }
});

router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail()
], async (req, res) => {
  try {
    if (failValidation(req, res)) return;
    const user = await findUserByEmail(req.body.email);
    if (user) {
      const otp = `${crypto.randomInt(0, 1000000)}`.padStart(6, '0');
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetOtpHash = await bcrypt.hash(otp, 12);
      user.passwordResetTokenHash = hashToken(resetToken);
      user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      user.passwordResetAttempts = 0;
      await user.save();
      await sendResetEmail(user.email, otp, resetToken);
    }
    return res.json({ success: true, message: 'If that email exists, password reset instructions have been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Failed to send password reset email' });
  }
});

router.post('/reset-password', [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('token').notEmpty().withMessage('Reset token is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  passwordRule().withMessage('New password must be 8+ characters and include uppercase, lowercase, number, and symbol')
], async (req, res) => {
  try {
    if (failValidation(req, res)) return;
    const user = await findUserByEmail(req.body.email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset request' });
    }
    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired reset request' });
    }
    if (user.passwordResetAttempts >= 5) {
      return res.status(429).json({ message: 'Too many reset attempts. Request a new code.' });
    }
    const tokenOk = user.passwordResetTokenHash === hashToken(req.body.token);
    const otpOk = await bcrypt.compare(req.body.otp, user.passwordResetOtpHash || '');
    if (!tokenOk || !otpOk) {
      user.passwordResetAttempts += 1;
      await user.save();
      return res.status(400).json({ message: 'Invalid or expired reset request' });
    }
    user.password = req.body.password;
    user.authProvider = 'local';
    user.refreshTokens = [];
    user.passwordResetTokenHash = undefined;
    user.passwordResetOtpHash = undefined;
    user.passwordResetExpiresAt = undefined;
    user.passwordResetAttempts = 0;
    await user.save();
    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Password reset failed' });
  }
});

router.get('/me', auth, async (req, res) => {
  res.json({ user: publicProfile(req.user) });
});

router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Invalid phone number'),
  body('preferredLanguage').optional().isIn(['en', 'hi', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'mr', 'pa', 'ur']).withMessage('Invalid language code')
], async (req, res) => {
  try {
    if (failValidation(req, res)) return;
    const allowedUpdates = ['name', 'firstName', 'lastName', 'phone', 'preferredLanguage', 'profilePicture', 'avatar', 'privacySettings', 'emergencyContact', 'preferences'];
    allowedUpdates.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        req.user[key] = req.body[key];
      }
    });
    await req.user.save();
    res.json({ message: 'Profile updated successfully', user: publicProfile(req.user) });
  } catch (error) {
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

router.put('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').matches(strongPassword).withMessage('New password must be 8+ characters and include uppercase, lowercase, number, and symbol')
], async (req, res) => {
  try {
    if (failValidation(req, res)) return;
    const isMatch = await req.user.comparePassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    req.user.password = req.body.newPassword;
    req.user.refreshTokens = [];
    await req.user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during password change' });
  }
});

router.delete('/deactivate', auth, async (req, res) => {
  try {
    req.user.isActive = false;
    req.user.refreshTokens = [];
    await req.user.save();
    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during account deactivation' });
  }
});

module.exports = router;
