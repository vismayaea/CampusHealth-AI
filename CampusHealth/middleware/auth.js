const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { findDemoAccount } = require('../utils/demoAccounts');

const accessSecret = () => process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev-jwt-secret';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, accessSecret());
    if (decoded.type && decoded.type !== 'access') {
      return res.status(401).json({ message: 'Invalid access token' });
    }

    if (decoded.demo) {
      const account = findDemoAccount({ role: decoded.role });
      if (!account) {
        return res.status(401).json({ message: 'Token is not valid' });
      }
      req.user = account.user;
      req.publicUser = account.user;
      return next();
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database connection unavailable. Authentication requires persistent storage.' });
    }

    const user = await User.findById(decoded.userId).select('-password').catch(() => null);
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    req.user = user;
    req.publicUser = typeof user.getPublicProfile === 'function' ? user.getPublicProfile() : user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

const requireRole = (allowedRoles, message) => async (req, res, next) => {
  await auth(req, res, () => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message });
    }
    next();
  });
};

module.exports = {
  auth,
  adminAuth: requireRole(['admin'], 'Admin access required'),
  counselorAuth: requireRole(['counselor', 'admin'], 'Counselor access required'),
  peerSupporterAuth: requireRole(['peer_supporter', 'counselor', 'admin'], 'Peer supporter access required')
};
