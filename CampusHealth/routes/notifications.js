const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const requireDatabase = require('../middleware/requireDatabase');

const router = express.Router();
router.use(requireDatabase);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('unreadOnly').optional().isBoolean().withMessage('unreadOnly must be boolean'),
  validate
], async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const filter = { userId: req.user._id };
    if (req.query.unreadOnly === 'true') filter.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: req.user._id, read: false })
    ]);

    res.json({
      notifications,
      unreadCount,
      pagination: { current: page, pages: Math.ceil(total / limit), total }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to get notifications' });
  }
});

router.get('/unread-count', auth, async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread notification count error:', error);
    res.status(500).json({ message: 'Failed to get unread notification count' });
  }
});

router.patch('/read-all', auth, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.json({ message: 'All notifications marked as read', modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
});

router.patch('/:id/read', auth, [
  param('id').isMongoId().withMessage('Invalid notification ID'),
  validate
], async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

router.post('/broadcast', adminAuth, [
  body('title').trim().isLength({ min: 3, max: 150 }).withMessage('Title must be 3 to 150 characters'),
  body('message').trim().isLength({ min: 3, max: 1000 }).withMessage('Message must be 3 to 1000 characters'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
  validate
], async (req, res) => {
  try {
    const recipients = await User.find({ isActive: true }).select('_id').lean();
    if (recipients.length === 0) {
      return res.status(400).json({ message: 'No active users available for broadcast' });
    }

    const notifications = recipients.map(user => ({
      userId: user._id,
      type: 'admin_broadcast',
      title: req.body.title,
      message: req.body.message,
      metadata: { ...(req.body.metadata || {}), sentBy: req.user._id }
    }));
    await Notification.insertMany(notifications);

    res.status(201).json({
      message: 'Announcement broadcast successfully',
      recipientCount: notifications.length
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({ message: 'Failed to broadcast announcement' });
  }
});

module.exports = router;
