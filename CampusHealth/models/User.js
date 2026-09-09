const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const refreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  userAgent: String
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: {
    type: String,
    minlength: 8,
    required: function() { return this.authProvider === 'local'; }
  },
  avatar: String,
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  firebaseUid: { type: String, unique: true, sparse: true },
  department: { type: String, required: true, trim: true },
  year: { type: String, trim: true },
  phone: { type: String, trim: true },
  preferences: {
    preferredLanguage: {
      type: String,
      default: 'en',
      enum: ['en', 'hi', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'mr', 'pa', 'ur']
    },
    showInPeerSupport: { type: Boolean, default: true },
    allowDirectMessages: { type: Boolean, default: true },
    shareAnalytics: { type: Boolean, default: true },
    appearance: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'highContrast'],
        default: 'light'
      },
      fontSize: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'medium'
      }
    }
  },

  // Backward-compatible fields used by existing protected pages/routes.
  studentId: { type: String, unique: true, sparse: true, trim: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  yearOfStudy: {
    type: String,
    enum: ['1', '2', '3', '4', '5', '1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Post Graduate', 'PhD']
  },
  preferredLanguage: {
    type: String,
    default: 'en',
    enum: ['en', 'hi', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'mr', 'pa', 'ur']
  },
  role: {
    type: String,
    default: 'student',
    enum: ['student', 'counselor', 'admin', 'peer_supporter']
  },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say'] },
  dateOfBirth: Date,
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  profilePicture: String,
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  privacySettings: {
    showInPeerSupport: { type: Boolean, default: true },
    allowDirectMessages: { type: Boolean, default: true },
    shareAnalytics: { type: Boolean, default: true }
  },
  mentalHealthHistory: {
    hasPreviousCounseling: { type: Boolean, default: false },
    currentMedications: [String],
    knownConditions: [String],
    emergencyContacts: [{
      name: String,
      phone: String,
      relationship: String
    }]
  },

  refreshTokens: [refreshTokenSchema],
  passwordResetTokenHash: String,
  passwordResetOtpHash: String,
  passwordResetExpiresAt: Date,
  passwordResetAttempts: { type: Number, default: 0 }
}, { timestamps: true });

userSchema.pre('validate', function(next) {
  if (!this.name && (this.firstName || this.lastName)) {
    this.name = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }
  if (!this.firstName && this.name) {
    const [firstName, ...rest] = this.name.trim().split(/\s+/);
    this.firstName = firstName;
    this.lastName = rest.join(' ') || this.lastName || '';
  }
  if (!this.lastName) {
    this.lastName = this.name?.split(/\s+/).slice(1).join(' ') || 'User';
  }
  if (!this.preferredLanguage && this.preferences?.preferredLanguage) {
    this.preferredLanguage = this.preferences.preferredLanguage;
  }
  if (!this.preferences?.preferredLanguage && this.preferredLanguage) {
    this.preferences = { ...(this.preferences || {}), preferredLanguage: this.preferredLanguage };
  }
  if (!this.year && this.yearOfStudy) {
    this.year = this.yearOfStudy;
  }
  if (!this.yearOfStudy && this.year) {
    this.yearOfStudy = this.year;
  }
  if (!this.profilePicture && this.avatar) {
    this.profilePicture = this.avatar;
  }
  if (!this.avatar && this.profilePicture) {
    this.avatar = this.profilePicture;
  }
  if (!this.studentId) {
    this.studentId = `USR-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  }
  next();
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshTokens;
  delete userObject.passwordResetTokenHash;
  delete userObject.passwordResetOtpHash;
  delete userObject.passwordResetExpiresAt;
  delete userObject.passwordResetAttempts;
  delete userObject.mentalHealthHistory;
  delete userObject.emergencyContact;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
