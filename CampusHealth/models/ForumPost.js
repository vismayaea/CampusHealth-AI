const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isModerated: {
    type: Boolean,
    default: false
  },
  moderatorNotes: {
    type: String
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const forumPostSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  category: {
    type: String,
    required: true,
    enum: ['general', 'anxiety', 'depression', 'stress', 'relationships', 'academic', 'coping-tips', 'success-stories', 'questions']
  },
  tags: [String],
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'hidden', 'deleted', 'under-review']
  },
  priority: {
    type: String,
    default: 'normal',
    enum: ['low', 'normal', 'high', 'urgent']
  },
  comments: [commentSchema],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  isModerated: {
    type: Boolean,
    default: false
  },
  moderatorNotes: {
    type: String
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  reportedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    reportedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'dismissed', 'actioned'],
      default: 'pending'
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  }],
  escalationLevel: {
    type: String,
    enum: ['none', 'peer-review', 'moderator-review', 'counselor-review', 'admin-review'],
    default: 'none'
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'hi', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'mr', 'pa', 'ur']
  },
  culturalContext: {
    type: String,
    enum: ['universal', 'indian', 'regional', 'institutional']
  },
  relatedResources: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update last activity on comment addition
forumPostSchema.methods.addComment = function(comment) {
  this.comments.push(comment);
  this.lastActivity = new Date();
  return this.save();
};

// Add like
forumPostSchema.methods.addLike = function(userId) {
  if (!this.likes.some(like => like.equals(userId))) {
    this.likes.push(userId);
  }
  return this.save();
};

// Remove like
forumPostSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => !like.equals(userId));
  return this.save();
};

// Increment view count
forumPostSchema.methods.incrementView = function() {
  this.views += 1;
  return this.save();
};

// Report post
forumPostSchema.methods.reportPost = function(userId, reason) {
  if (this.reportedBy.some(report => report.userId.equals(userId) && report.status === 'pending')) {
    return Promise.reject(Object.assign(new Error('You have already reported this post'), { code: 'DUPLICATE_REPORT' }));
  }
  this.reportedBy.push({
    userId,
    reason,
    reportedAt: new Date()
  });
  return this.save();
};

forumPostSchema.index({ status: 1, category: 1, createdAt: -1 });
forumPostSchema.index({ authorId: 1, createdAt: -1 });
forumPostSchema.index({ 'reportedBy.status': 1, createdAt: -1 });
forumPostSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Get post summary for analytics
forumPostSchema.methods.getAnalyticsSummary = function() {
  return {
    postId: this._id,
    category: this.category,
    status: this.status,
    priority: this.priority,
    isAnonymous: this.isAnonymous,
    language: this.language,
    culturalContext: this.culturalContext,
    commentCount: this.comments.length,
    likeCount: this.likes.length,
    viewCount: this.views,
    isModerated: this.isModerated,
    escalationLevel: this.escalationLevel,
    reportCount: this.reportedBy.length
  };
};

module.exports = mongoose.model('ForumPost', forumPostSchema);
