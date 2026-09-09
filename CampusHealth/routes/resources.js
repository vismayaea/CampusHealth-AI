const express = require('express');
const moment = require('moment');
const { body, validationResult } = require('express-validator');
const Resource = require('../models/Resource');
const { auth, adminAuth } = require('../middleware/auth');
const requireDatabase = require('../middleware/requireDatabase');

const router = express.Router();
router.use(requireDatabase);

// Get all resources with filtering
router.get('/', auth, async (req, res) => {
  try {
    const {
      category,
      type,
      language = 'en',
      difficulty,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true, isApproved: true };
    
    if (category) {
      query.category = category;
    }
    if (type) {
      query.type = type;
    }
    if (language) {
      query.language = language;
    }
    if (difficulty) {
      query.difficulty = difficulty;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const resources = await Resource.find(query)
      .select('-content')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Resource.countDocuments(query);

    res.json({
      resources,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ message: 'Failed to get resources' });
  }
});

// Rate a resource
router.post('/:id/rate', auth, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { rating } = req.body;

    const resource = await Resource.findById(id);
    
    if (!resource || !resource.isActive || !resource.isApproved) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    await resource.addRating(rating);

    res.json({ 
      message: 'Rating added successfully',
      averageRating: resource.rating.average,
      totalRatings: resource.rating.count
    });
  } catch (error) {
    console.error('Rate resource error:', error);
    res.status(500).json({ message: 'Failed to rate resource' });
  }
});

// Like a resource
router.post('/:id/like', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findById(id);
    
    if (!resource || !resource.isActive || !resource.isApproved) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    resource.likeCount += 1;
    await resource.save();

    res.json({ 
      message: 'Resource liked successfully',
      likeCount: resource.likeCount
    });
  } catch (error) {
    console.error('Like resource error:', error);
    res.status(500).json({ message: 'Failed to like resource' });
  }
});

// Share a resource
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { platform } = req.body; // email, whatsapp, social media, etc.

    const resource = await Resource.findById(id);
    
    if (!resource || !resource.isActive || !resource.isApproved) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    resource.shareCount += 1;
    await resource.save();

    // In a real app, this would generate shareable links
    const shareUrl = `${process.env.CLIENT_URL}/resources/${id}`;

    res.json({ 
      message: 'Resource shared successfully',
      shareUrl,
      shareCount: resource.shareCount
    });
  } catch (error) {
    console.error('Share resource error:', error);
    res.status(500).json({ message: 'Failed to share resource' });
  }
});

// Get resource categories
router.get('/categories/list', auth, async (req, res) => {
  try {
    const categories = [
      {
        id: 'anxiety',
        name: 'Anxiety',
        description: 'Resources for managing anxiety and worry',
        icon: 'anxiety-icon',
        color: '#FF6B6B'
      },
      {
        id: 'depression',
        name: 'Depression',
        description: 'Resources for understanding and managing depression',
        icon: 'depression-icon',
        color: '#4ECDC4'
      },
      {
        id: 'stress',
        name: 'Stress Management',
        description: 'Tools and techniques for stress relief',
        icon: 'stress-icon',
        color: '#45B7D1'
      },
      {
        id: 'mindfulness',
        name: 'Mindfulness',
        description: 'Meditation and mindfulness practices',
        icon: 'mindfulness-icon',
        color: '#96CEB4'
      },
      {
        id: 'coping-skills',
        name: 'Coping Skills',
        description: 'Practical strategies for daily challenges',
        icon: 'coping-icon',
        color: '#FFEAA7'
      },
      {
        id: 'relationships',
        name: 'Relationships',
        description: 'Building and maintaining healthy relationships',
        icon: 'relationships-icon',
        color: '#DDA0DD'
      },
      {
        id: 'academic',
        name: 'Academic Support',
        description: 'Study skills and academic stress management',
        icon: 'academic-icon',
        color: '#98D8C8'
      },
      {
        id: 'general',
        name: 'General Wellness',
        description: 'General mental health and wellness resources',
        icon: 'wellness-icon',
        color: '#F7DC6F'
      }
    ];

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Failed to get categories' });
  }
});

// Get featured resources
router.get('/featured/list', auth, async (req, res) => {
  try {
    const { language = 'en' } = req.query;

    const featuredResources = await Resource.find({
      isActive: true,
      isApproved: true,
      language,
      rating: { $gte: 4.0 },
      viewCount: { $gte: 10 }
    })
    .sort({ rating: -1, viewCount: -1 })
    .limit(6)
    .select('-content');

    res.json({ featuredResources });
  } catch (error) {
    console.error('Get featured resources error:', error);
    res.status(500).json({ message: 'Failed to get featured resources' });
  }
});

// Get trending resources
router.get('/trending/list', auth, async (req, res) => {
  try {
    const { language = 'en', timeframe = 'week' } = req.query;

    let dateFilter;
    switch (timeframe) {
      case 'day':
        dateFilter = moment().subtract(1, 'day');
        break;
      case 'week':
        dateFilter = moment().subtract(1, 'week');
        break;
      case 'month':
        dateFilter = moment().subtract(1, 'month');
        break;
      default:
        dateFilter = moment().subtract(1, 'week');
    }

    const trendingResources = await Resource.find({
      isActive: true,
      isApproved: true,
      language,
      createdAt: { $gte: dateFilter.toDate() }
    })
    .sort({ viewCount: -1, likeCount: -1 })
    .limit(10)
    .select('-content');

    res.json({ trendingResources });
  } catch (error) {
    console.error('Get trending resources error:', error);
    res.status(500).json({ message: 'Failed to get trending resources' });
  }
});

// Admin routes
// Create new resource
router.post('/', adminAuth, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('type').isIn(['article', 'video', 'audio', 'infographic', 'worksheet', 'exercise', 'meditation'])
    .withMessage('Invalid resource type'),
  body('category').isIn(['anxiety', 'depression', 'stress', 'mindfulness', 'coping-skills', 'relationships', 'academic', 'general'])
    .withMessage('Invalid category'),
  body('language').isIn(['en', 'hi', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'mr', 'pa', 'ur'])
    .withMessage('Invalid language code')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const resourceData = {
      ...req.body,
      author: req.user.firstName + ' ' + req.user.lastName,
      source: 'internal',
      isApproved: true,
      approvedBy: req.user._id,
      approvedAt: new Date()
    };

    const resource = new Resource(resourceData);
    await resource.save();

    res.status(201).json({
      message: 'Resource created successfully',
      resource
    });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ message: 'Failed to create resource' });
  }
});

// Update resource
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const resource = await Resource.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json({
      message: 'Resource updated successfully',
      resource
    });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({ message: 'Failed to update resource' });
  }
});

// Delete resource
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ message: 'Failed to delete resource' });
  }
});

// Get resource analytics
router.get('/analytics/overview', adminAuth, async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;

    let dateFilter;
    switch (timeframe) {
      case 'day':
        dateFilter = moment().subtract(1, 'day');
        break;
      case 'week':
        dateFilter = moment().subtract(1, 'week');
        break;
      case 'month':
        dateFilter = moment().subtract(1, 'month');
        break;
      case 'year':
        dateFilter = moment().subtract(1, 'year');
        break;
      default:
        dateFilter = moment().subtract(1, 'month');
    }

    const totalResources = await Resource.countDocuments({ isActive: true });
    const totalViews = await Resource.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$viewCount' } } }
    ]);

    const categoryStats = await Resource.aggregate([
      { $match: { isActive: true, isApproved: true } },
      { $group: { 
        _id: '$category', 
        count: { $sum: 1 },
        totalViews: { $sum: '$viewCount' },
        avgRating: { $avg: '$rating.average' }
      }},
      { $sort: { count: -1 } }
    ]);

    const languageStats = await Resource.aggregate([
      { $match: { isActive: true, isApproved: true } },
      { $group: { 
        _id: '$language', 
        count: { $sum: 1 },
        totalViews: { $sum: '$viewCount' }
      }},
      { $sort: { count: -1 } }
    ]);

    const topResources = await Resource.find({
      isActive: true,
      isApproved: true
    })
    .sort({ viewCount: -1 })
    .limit(10)
    .select('title category viewCount likeCount rating');

    res.json({
      totalResources,
      totalViews: totalViews[0]?.total || 0,
      categoryStats,
      languageStats,
      topResources,
      timeframe
    });
  } catch (error) {
    console.error('Get resource analytics error:', error);
    res.status(500).json({ message: 'Failed to get resource analytics' });
  }
});

// Get specific resource
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const resource = await Resource.findById(id);
    if (!resource || !resource.isActive || !resource.isApproved) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    await resource.incrementView();

    res.json({ resource });
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({ message: 'Failed to get resource' });
  }
});

module.exports = router;
