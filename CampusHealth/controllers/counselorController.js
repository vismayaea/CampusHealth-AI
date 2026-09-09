const mongoose = require('mongoose');
const Counselor = require('../models/Counselor');
const User = require('../models/User');

const allowedFields = [
  'userId',
  'name',
  'email',
  'specialization',
  'qualification',
  'experience',
  'bio',
  'languages',
  'city',
  'phone',
  'profileImage',
  'availableSlots',
  'status'
];

const pickCounselorFields = (body) => allowedFields.reduce((data, field) => {
  if (body[field] !== undefined) {
    data[field] = body[field];
  }
  return data;
}, {});

const databaseUnavailable = (res) => res.status(503).json({
  success: false,
  message: 'Database unavailable'
});

const resolveCounselorUser = async ({ userId, email }) => {
  if (userId !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { error: 'userId must be a valid User ObjectId' };
    }
    const user = await User.findOne({ _id: userId, role: 'counselor' }).select('_id email role');
    return user
      ? { user }
      : { error: 'userId must reference an existing counselor user' };
  }

  if (!email) return { user: null };
  const user = await User.findOne({
    email: String(email).trim().toLowerCase(),
    role: 'counselor'
  }).select('_id email role');
  return { user };
};

const getCounselors = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return databaseUnavailable(res);
    }

    const {
      status,
      specialization,
      search,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const query = {};

    if (status) query.status = status;
    if (specialization) query.specialization = { $regex: specialization, $options: 'i' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
        { qualification: { $regex: search, $options: 'i' } },
        { languages: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [counselors, total] = await Promise.all([
      Counselor.find(query)
        .sort(sortOptions)
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize),
      Counselor.countDocuments(query)
    ]);

    return res.json({
      success: true,
      counselors,
      pagination: {
        current: currentPage,
        pages: Math.ceil(total / pageSize),
        total
      }
    });
  } catch (error) {
    console.error('Get counselors error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get counselors' });
  }
};

const getCounselorById = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return databaseUnavailable(res);
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid counselor id' });
    }

    const counselor = await Counselor.findById(req.params.id);
    if (!counselor) {
      return res.status(404).json({ success: false, message: 'Counselor not found' });
    }

    return res.json({ success: true, counselor });
  } catch (error) {
    console.error('Get counselor error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get counselor' });
  }
};

const createCounselor = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return databaseUnavailable(res);
    }

    const counselorData = pickCounselorFields(req.body);
    const linkedUser = await resolveCounselorUser({
      userId: req.body.userId,
      email: counselorData.email
    });
    if (linkedUser.error) {
      return res.status(400).json({ success: false, message: linkedUser.error });
    }
    if (linkedUser.user) {
      counselorData.userId = linkedUser.user._id;
      const existingProfile = await Counselor.exists({ userId: linkedUser.user._id });
      if (existingProfile) {
        return res.status(409).json({ success: false, message: 'A counselor profile is already linked to this user' });
      }
    }

    const counselor = await Counselor.create(counselorData);
    return res.status(201).json({
      success: true,
      message: 'Counselor created successfully',
      counselor
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'A counselor profile already exists for this user or email' });
    }
    console.error('Create counselor error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create counselor' });
  }
};

const updateCounselor = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return databaseUnavailable(res);
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid counselor id' });
    }

    const counselor = await Counselor.findById(req.params.id);
    if (!counselor) {
      return res.status(404).json({ success: false, message: 'Counselor not found' });
    }

    const updates = pickCounselorFields(req.body);
    let linkedUser = { user: null };
    if (req.body.userId !== undefined) {
      linkedUser = await resolveCounselorUser({ userId: req.body.userId });
    } else if (!counselor.userId) {
      linkedUser = await resolveCounselorUser({ email: updates.email || counselor.email });
    }
    if (linkedUser.error) {
      return res.status(400).json({ success: false, message: linkedUser.error });
    }
    if (linkedUser.user) {
      const existingProfile = await Counselor.exists({
        userId: linkedUser.user._id,
        _id: { $ne: counselor._id }
      });
      if (existingProfile) {
        return res.status(409).json({ success: false, message: 'A counselor profile is already linked to this user' });
      }
      updates.userId = linkedUser.user._id;
    }

    Object.assign(counselor, updates);
    await counselor.save();

    return res.json({
      success: true,
      message: 'Counselor updated successfully',
      counselor
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'A counselor profile already exists for this user or email' });
    }
    console.error('Update counselor error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update counselor' });
  }
};

const deleteCounselor = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return databaseUnavailable(res);
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid counselor id' });
    }

    const counselor = await Counselor.findByIdAndDelete(req.params.id);
    if (!counselor) {
      return res.status(404).json({ success: false, message: 'Counselor not found' });
    }

    return res.json({
      success: true,
      message: 'Counselor deleted successfully'
    });
  } catch (error) {
    console.error('Delete counselor error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete counselor' });
  }
};

module.exports = {
  getCounselors,
  getCounselorById,
  createCounselor,
  updateCounselor,
  deleteCounselor
};
