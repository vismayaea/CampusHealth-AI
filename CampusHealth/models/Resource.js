const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['article', 'video', 'audio', 'infographic', 'worksheet', 'exercise', 'meditation']
  },
  category: {
    type: String,
    required: true,
    enum: ['anxiety', 'depression', 'stress', 'mindfulness', 'coping-skills', 'relationships', 'academic', 'general']
  },
  language: {
    type: String,
    required: true,
    default: 'en',
    enum: ['en', 'hi', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'mr', 'pa', 'ur']
  },
  tags: [String],
  difficulty: {
    type: String,
    default: 'beginner',
    enum: ['beginner', 'intermediate', 'advanced']
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  fileUrl: {
    type: String
  },
  thumbnailUrl: {
    type: String
  },
  author: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ['internal', 'external', 'peer-contributed']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  viewCount: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  },
  shareCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  accessibility: {
    hasSubtitles: {
      type: Boolean,
      default: false
    },
    hasTranscript: {
      type: Boolean,
      default: false
    },
    isAudioDescribed: {
      type: Boolean,
      default: false
    }
  },
  targetAudience: {
    type: String,
    enum: ['all', 'first-year', 'senior', 'graduate', 'international', 'specific-condition']
  },
  culturalContext: {
    type: String,
    enum: ['universal', 'indian', 'regional', 'institutional']
  },
  relatedResources: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  }],
  usageInstructions: {
    type: String
  },
  warnings: [String],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Increment view count
resourceSchema.methods.incrementView = function() {
  this.viewCount += 1;
  return this.save();
};

// Add rating
resourceSchema.methods.addRating = function(rating) {
  const currentTotal = this.rating.average * this.rating.count;
  this.rating.count += 1;
  this.rating.average = (currentTotal + rating) / this.rating.count;
  return this.save();
};

// Get resource summary for analytics
resourceSchema.methods.getAnalyticsSummary = function() {
  return {
    resourceId: this._id,
    type: this.type,
    category: this.category,
    language: this.language,
    difficulty: this.difficulty,
    viewCount: this.viewCount,
    likeCount: this.likeCount,
    rating: this.rating.average,
    isActive: this.isActive,
    culturalContext: this.culturalContext
  };
};

module.exports = mongoose.model('Resource', resourceSchema);
