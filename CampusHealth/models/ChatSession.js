const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant', 'system']
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    messageType: {
      type: String,
      enum: ['text', 'suggestion', 'resource', 'screening_prompt']
    },
    suggestions: [String],
    resourceId: String,
    screeningType: String
  }
});

const chatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  messages: [messageSchema],
  context: {
    currentMood: String,
    lastScreening: Date,
    activeConcerns: [String],
    preferredLanguage: String,
    sessionGoals: [String]
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'paused', 'completed', 'escalated']
  },
  escalationLevel: {
    type: String,
    enum: ['none', 'peer-support', 'counseling', 'urgent', 'emergency'],
    default: 'none'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  },
  counselorNotes: {
    type: String
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Update last activity on message addition
chatSessionSchema.methods.addMessage = function(message) {
  this.messages.push(message);
  this.lastActivity = new Date();
  return this.save();
};

// Get session summary for analytics (anonymized)
chatSessionSchema.methods.getAnalyticsSummary = function() {
  return {
    sessionId: this.sessionId,
    duration: this.endedAt ? this.endedAt - this.startedAt : Date.now() - this.startedAt,
    messageCount: this.messages.length,
    escalationLevel: this.escalationLevel,
    status: this.status,
    hasFollowUp: this.followUpRequired,
    isAnonymous: this.isAnonymous,
    language: this.context.preferredLanguage,
    concerns: this.context.activeConcerns
  };
};

module.exports = mongoose.model('ChatSession', chatSessionSchema);
