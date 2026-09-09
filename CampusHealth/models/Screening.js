const mongoose = require('mongoose');

const screeningSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['PHQ-9', 'GAD-7', 'PSS-10', 'custom']
  },
  responses: [{
    questionId: String,
    questionText: String,
    response: Number, // 0-3 scale for most questionnaires
    responseText: String
  }],
  totalScore: {
    type: Number,
    required: true
  },
  severity: {
    type: String,
    required: true,
    enum: ['minimal', 'mild', 'moderate', 'moderately-severe', 'severe']
  },
  recommendations: [{
    type: String,
    enum: ['self-help', 'peer-support', 'counseling', 'urgent-care', 'emergency']
  }],
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  counselorNotes: {
    type: String
  },
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate severity based on score and type
screeningSchema.methods.calculateSeverity = function() {
  const { type, totalScore } = this;
  
  switch (type) {
    case 'PHQ-9':
      if (totalScore <= 4) return 'minimal';
      if (totalScore <= 9) return 'mild';
      if (totalScore <= 14) return 'moderate';
      if (totalScore <= 19) return 'moderately-severe';
      return 'severe';
      
    case 'GAD-7':
      if (totalScore <= 4) return 'minimal';
      if (totalScore <= 9) return 'mild';
      if (totalScore <= 14) return 'moderate';
      return 'severe';
      
    case 'PSS-10':
      if (totalScore <= 13) return 'minimal';
      if (totalScore <= 16) return 'mild';
      if (totalScore <= 19) return 'moderate';
      return 'severe';
      
    default:
      return 'minimal';
  }
};

// Generate recommendations based on severity
screeningSchema.methods.generateRecommendations = function() {
  const { severity } = this;
  
  switch (severity) {
    case 'minimal':
      return ['self-help'];
    case 'mild':
      return ['self-help', 'peer-support'];
    case 'moderate':
      return ['self-help', 'peer-support', 'counseling'];
    case 'moderately-severe':
      return ['counseling', 'urgent-care'];
    case 'severe':
      return ['urgent-care', 'emergency'];
    default:
      return ['self-help'];
  }
};

module.exports = mongoose.model('Screening', screeningSchema);
