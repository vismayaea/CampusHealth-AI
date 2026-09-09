const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { adminAuth } = require('../middleware/auth');
const {
  getCounselors,
  getCounselorById,
  createCounselor,
  updateCounselor,
  deleteCounselor
} = require('../controllers/counselorController');

const router = express.Router();
const statuses = ['Available', 'Busy'];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  return next();
};

const slotValidators = [
  body('availableSlots').optional().isArray().withMessage('availableSlots must be an array'),
  body('availableSlots.*.day').optional().isIn(days).withMessage('Invalid slot day'),
  body('availableSlots.*.date').optional().isISO8601().withMessage('Invalid slot date'),
  body('availableSlots.*.startTime').optional().matches(timePattern).withMessage('startTime must be in HH:mm format'),
  body('availableSlots.*.endTime').optional().matches(timePattern).withMessage('endTime must be in HH:mm format'),
  body('availableSlots.*.isAvailable').optional().isBoolean().withMessage('isAvailable must be boolean')
];

const createCounselorValidation = [
  body('userId').optional().isMongoId().withMessage('userId must be a valid User ObjectId'),
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Name must be 2-120 characters'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('specialization').trim().isLength({ min: 2, max: 160 }).withMessage('Specialization must be 2-160 characters'),
  body('qualification').trim().isLength({ min: 2, max: 160 }).withMessage('Qualification must be 2-160 characters'),
  body('experience').isFloat({ min: 0, max: 80 }).withMessage('Experience must be between 0 and 80 years'),
  body('bio').trim().isLength({ min: 10, max: 2000 }).withMessage('Bio must be 10-2000 characters'),
  body('profileImage').optional({ checkFalsy: true }).isURL().withMessage('profileImage must be a valid URL'),
  body('status').optional().isIn(statuses).withMessage('Status must be Available or Busy'),
  ...slotValidators
];

const updateCounselorValidation = [
  body().custom((value) => {
    if (!value || Object.keys(value).length === 0) {
      throw new Error('At least one field is required');
    }
    return true;
  }),
  body('userId').optional().isMongoId().withMessage('userId must be a valid User ObjectId'),
  body('name').optional().trim().isLength({ min: 2, max: 120 }).withMessage('Name must be 2-120 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('specialization').optional().trim().isLength({ min: 2, max: 160 }).withMessage('Specialization must be 2-160 characters'),
  body('qualification').optional().trim().isLength({ min: 2, max: 160 }).withMessage('Qualification must be 2-160 characters'),
  body('experience').optional().isFloat({ min: 0, max: 80 }).withMessage('Experience must be between 0 and 80 years'),
  body('bio').optional().trim().isLength({ min: 10, max: 2000 }).withMessage('Bio must be 10-2000 characters'),
  body('profileImage').optional({ checkFalsy: true }).isURL().withMessage('profileImage must be a valid URL'),
  body('status').optional().isIn(statuses).withMessage('Status must be Available or Busy'),
  ...slotValidators
];

router.get('/', [
  query('status').optional().isIn(statuses).withMessage('Invalid status'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder must be asc or desc')
], validate, getCounselors);

router.get('/:id', getCounselorById);
router.post('/', adminAuth, createCounselorValidation, validate, createCounselor);
router.put('/:id', adminAuth, updateCounselorValidation, validate, updateCounselor);
router.delete('/:id', adminAuth, deleteCounselor);

module.exports = router;
