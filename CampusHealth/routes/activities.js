const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const requireDatabase = require('../middleware/requireDatabase');
const { notifyUser, notifyUsers } = require('../utils/notificationService');

const router = express.Router();
router.use(requireDatabase);

const activityStatuses = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

const failValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    return true;
  }
  return false;
};

const canManageActivity = (user, activity) => {
  if (user.role === 'admin') return true;
  return ['counselor', 'peer_supporter'].includes(user.role)
    && String(activity.organizer?._id || activity.organizer) === String(user._id);
};

const activityPayloadValidation = (partial = false) => {
  const maybeOptional = (chain) => (partial ? chain.optional({ nullable: true }) : chain);
  return [
    maybeOptional(body('title')).trim().isLength({ min: 3, max: 120 }).withMessage('Title must be 3-120 characters'),
    maybeOptional(body('description')).trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
    maybeOptional(body('category')).trim().notEmpty().withMessage('Category is required'),
    body('image').optional({ checkFalsy: true }).isString().withMessage('Image must be a string URL or data URL'),
    body('speakerName').optional({ checkFalsy: true }).trim().isLength({ max: 120 }).withMessage('Speaker name must be under 120 characters'),
    body('speakerDesignation').optional({ checkFalsy: true }).trim().isLength({ max: 160 }).withMessage('Speaker designation must be under 160 characters'),
    body('venue').optional({ checkFalsy: true }).trim().isLength({ max: 200 }).withMessage('Venue must be under 200 characters'),
    maybeOptional(body('location')).trim().notEmpty().withMessage('Location is required'),
    body('mapDescription').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Map description must be under 500 characters'),
    body('duration').optional({ checkFalsy: true }).isInt({ min: 15, max: 480 }).withMessage('Duration must be 15-480 minutes'),
    body('agenda').optional().isArray({ max: 12 }).withMessage('Agenda must be a list of up to 12 items'),
    body('agenda.*').optional({ checkFalsy: true }).trim().isLength({ max: 180 }).withMessage('Agenda items must be under 180 characters'),
    body('contactEmail').optional({ checkFalsy: true }).isEmail().withMessage('Contact email must be valid').normalizeEmail(),
    body('contactPhone').optional({ checkFalsy: true }).trim().isLength({ max: 30 }).withMessage('Contact phone must be under 30 characters'),
    body('tags').optional().isArray({ max: 12 }).withMessage('Tags must be a list of up to 12 items'),
    body('tags.*').optional({ checkFalsy: true }).trim().isLength({ max: 40 }).withMessage('Tags must be under 40 characters'),
    maybeOptional(body('startDate')).isISO8601().withMessage('Valid start date is required'),
    maybeOptional(body('endDate')).isISO8601().withMessage('Valid end date is required'),
    maybeOptional(body('capacity')).isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
    body('status').optional().isIn(activityStatuses).withMessage('Invalid activity status')
  ];
};

const listValidation = [
  query('search').optional({ checkFalsy: true }).trim(),
  query('category').optional({ checkFalsy: true }).trim(),
  query('date').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date filter'),
  query('status').optional({ checkFalsy: true }).isIn(activityStatuses).withMessage('Invalid status'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50')
];

router.get('/summary', auth, async (req, res) => {
  try {
    const now = new Date();
    const [upcomingActivities, myRegistrations] = await Promise.all([
      Activity.countDocuments({ status: { $in: ['Upcoming', 'Ongoing'] }, startDate: { $gte: now } }),
      Activity.countDocuments({ 'registeredStudents.student': req.user._id })
    ]);

    res.json({
      summary: {
        upcomingActivities,
        myRegistrations
      }
    });
  } catch (error) {
    console.error('Activities summary error:', error);
    res.status(500).json({ message: 'Failed to load activities summary' });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const activities = await Activity.find({ 'registeredStudents.student': req.user._id })
      .populate('organizer', 'name firstName lastName email role')
      .sort({ startDate: 1 });

    res.json({ activities });
  } catch (error) {
    console.error('My activities error:', error);
    res.status(500).json({ message: 'Failed to load your activities' });
  }
});

router.get('/', auth, listValidation, async (req, res) => {
  try {
    if (failValidation(req, res)) return;

    const {
      search,
      category,
      date,
      status,
      page = 1,
      limit = 12
    } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      filter.startDate = { $gte: start, $lt: end };
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
        { speakerName: { $regex: search, $options: 'i' } },
        { speakerDesignation: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNumber = Number(page);
    const pageSize = Number(limit);
    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .populate('organizer', 'name firstName lastName email role')
        .sort({ startDate: 1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
      Activity.countDocuments(filter)
    ]);

    res.json({
      activities,
      pagination: {
        current: pageNumber,
        pages: Math.ceil(total / pageSize),
        total
      }
    });
  } catch (error) {
    console.error('List activities error:', error);
    res.status(500).json({ message: 'Failed to load activities' });
  }
});

router.post('/', auth, activityPayloadValidation(), async (req, res) => {
  try {
    if (failValidation(req, res)) return;
    if (!['admin', 'counselor', 'peer_supporter'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only admins and counselors can create activities' });
    }

    const activity = new Activity({
      ...req.body,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      organizer: req.user._id
    });
    await activity.save();
    await activity.populate('organizer', 'name firstName lastName email role');

    res.status(201).json({ message: 'Activity created successfully', activity });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ message: 'Failed to create activity' });
  }
});

router.get('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid activity ID')
], async (req, res) => {
  try {
    if (failValidation(req, res)) return;

    const activity = await Activity.findById(req.params.id)
      .populate('organizer', 'name firstName lastName email role')
      .populate('registeredStudents.student', 'name firstName lastName email department year role');

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.json({ activity });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ message: 'Failed to load activity' });
  }
});

router.put('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid activity ID'),
  ...activityPayloadValidation(true)
], async (req, res) => {
  try {
    if (failValidation(req, res)) return;

    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    if (!canManageActivity(req.user, activity)) {
      return res.status(403).json({ message: 'You cannot edit this activity' });
    }
    if (req.body.capacity && Number(req.body.capacity) < activity.registeredStudents.length) {
      return res.status(400).json({ message: 'Capacity cannot be lower than current registrations' });
    }

    const allowed = [
      'title',
      'description',
      'category',
      'image',
      'speakerName',
      'speakerDesignation',
      'venue',
      'location',
      'mapDescription',
      'duration',
      'agenda',
      'contactEmail',
      'contactPhone',
      'tags',
      'startDate',
      'endDate',
      'capacity',
      'status'
    ];
    allowed.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        activity[key] = ['startDate', 'endDate'].includes(key) ? new Date(req.body[key]) : req.body[key];
      }
    });

    await activity.save();
    await activity.populate('organizer', 'name firstName lastName email role');
    await notifyUsers(
      activity.registeredStudents.map((entry) => entry.student),
      {
        type: 'activity_updated',
        title: 'Activity updated',
        message: `${activity.title} has been updated. Review the latest details.`,
        metadata: { activityId: activity._id }
      }
    );
    res.json({ message: 'Activity updated successfully', activity });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ message: 'Failed to update activity' });
  }
});

router.delete('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid activity ID')
], async (req, res) => {
  try {
    if (failValidation(req, res)) return;

    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    if (!canManageActivity(req.user, activity)) {
      return res.status(403).json({ message: 'You cannot delete this activity' });
    }

    await Activity.deleteOne({ _id: activity._id });
    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ message: 'Failed to delete activity' });
  }
});

router.post('/:id/register', auth, [
  param('id').isMongoId().withMessage('Invalid activity ID')
], async (req, res) => {
  try {
    if (failValidation(req, res)) return;
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can register for activities' });
    }

    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    if (activity.status !== 'Upcoming') {
      return res.status(400).json({ message: 'Registration is only open for upcoming activities' });
    }
    if (activity.startDate <= new Date()) {
      return res.status(400).json({ message: 'Cannot register for past activities' });
    }
    if (activity.registeredStudents.some((entry) => String(entry.student) === String(req.user._id))) {
      return res.status(409).json({ message: 'You are already registered for this activity' });
    }
    if (activity.registeredStudents.length >= activity.capacity) {
      return res.status(400).json({ message: 'Activity is at full capacity' });
    }

    const studentExists = await User.exists({ _id: req.user._id, role: 'student', isActive: true });
    if (!studentExists) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const updatedActivity = await Activity.findOneAndUpdate(
      {
        _id: activity._id,
        status: 'Upcoming',
        startDate: { $gt: new Date() },
        'registeredStudents.student': { $ne: req.user._id },
        $expr: { $lt: [{ $size: '$registeredStudents' }, '$capacity'] }
      },
      {
        $push: {
          registeredStudents: {
            student: req.user._id,
            registeredAt: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedActivity) {
      return res.status(409).json({ message: 'Registration is no longer available' });
    }

    await notifyUser({
      userId: req.user._id,
      type: 'activity_registration_confirmed',
      title: 'Activity registration confirmed',
      message: `You are registered for ${updatedActivity.title}.`,
      metadata: { activityId: updatedActivity._id }
    });
    if (updatedActivity.registeredStudents.length === updatedActivity.capacity) {
      await notifyUser({
        userId: updatedActivity.organizer,
        type: 'activity_capacity_full',
        title: 'Activity capacity reached',
        message: `${updatedActivity.title} has reached full capacity.`,
        metadata: { activityId: updatedActivity._id }
      });
    }

    res.json({
      message: 'Registered successfully',
      registeredCount: updatedActivity.registeredStudents.length,
      availableSeats: Math.max(0, updatedActivity.capacity - updatedActivity.registeredStudents.length)
    });
  } catch (error) {
    console.error('Register activity error:', error);
    res.status(500).json({ message: 'Failed to register for activity' });
  }
});

router.delete('/:id/register', auth, [
  param('id').isMongoId().withMessage('Invalid activity ID')
], async (req, res) => {
  try {
    if (failValidation(req, res)) return;

    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    const before = activity.registeredStudents.length;
    activity.registeredStudents = activity.registeredStudents.filter(
      (entry) => String(entry.student) !== String(req.user._id)
    );
    if (activity.registeredStudents.length === before) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    await activity.save();
    await notifyUser({
      userId: req.user._id,
      type: 'activity_registration_cancelled',
      title: 'Activity registration cancelled',
      message: `Your registration for ${activity.title} has been cancelled.`,
      metadata: { activityId: activity._id }
    });
    res.json({
      message: 'Registration cancelled successfully',
      registeredCount: activity.registeredStudents.length,
      availableSeats: Math.max(0, activity.capacity - activity.registeredStudents.length)
    });
  } catch (error) {
    console.error('Cancel activity registration error:', error);
    res.status(500).json({ message: 'Failed to cancel registration' });
  }
});

router.get('/:id/registrations', auth, [
  param('id').isMongoId().withMessage('Invalid activity ID')
], async (req, res) => {
  try {
    if (failValidation(req, res)) return;

    const activity = await Activity.findById(req.params.id)
      .populate('registeredStudents.student', 'name firstName lastName email department year role')
      .populate('organizer', 'name firstName lastName email role');

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    if (!canManageActivity(req.user, activity)) {
      return res.status(403).json({ message: 'You cannot view registrations for this activity' });
    }

    res.json({
      activity: {
        _id: activity._id,
        title: activity.title,
        capacity: activity.capacity,
        registeredCount: activity.registeredStudents.length
      },
      registrations: activity.registeredStudents
    });
  } catch (error) {
    console.error('Activity registrations error:', error);
    res.status(500).json({ message: 'Failed to load registrations' });
  }
});

module.exports = router;
