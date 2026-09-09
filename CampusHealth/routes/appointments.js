const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { appointmentStatuses } = require('../models/Appointment');
const { auth } = require('../middleware/auth');
const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  getAppointmentsByStudent,
  getAppointmentsByCounselor,
  updateAppointmentStatus,
  deleteAppointment,
  getAppointmentAvailability
} = require('../controllers/appointmentController');

const router = express.Router();
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

const objectIdParam = (name) => param(name).isMongoId().withMessage(`Invalid ${name}`);
const objectIdBody = (name) => body(name).isMongoId().withMessage(`Invalid ${name}`);

const createAppointmentValidation = [
  objectIdBody('studentId'),
  objectIdBody('counselorId'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').matches(timePattern).withMessage('time must be in HH:mm format'),
  body('meetingType').isIn(['online', 'in-person']).withMessage('Meeting type must be online or in-person'),
  body('duration').optional().isInt({ min: 15, max: 240 }).withMessage('duration must be between 15 and 240 minutes'),
  body('status').optional().isIn(appointmentStatuses).withMessage('Invalid appointment status'),
  body('notes').optional({ checkFalsy: true }).isLength({ max: 2000 }).withMessage('notes cannot exceed 2000 characters')
];

router.post('/', auth, createAppointmentValidation, validate, createAppointment);

router.get('/', auth, [
  query('status').optional().isIn(appointmentStatuses).withMessage('Invalid appointment status'),
  query('studentId').optional().isMongoId().withMessage('Invalid studentId'),
  query('counselorId').optional().isMongoId().withMessage('Invalid counselorId'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder must be asc or desc')
], validate, getAppointments);

router.get('/availability', auth, [
  query('counselorId').isMongoId().withMessage('Invalid counselorId'),
  query('date').isISO8601().withMessage('Valid date is required')
], validate, getAppointmentAvailability);

router.get('/student/:studentId', auth, [
  objectIdParam('studentId')
], validate, getAppointmentsByStudent);

router.get('/counselor/:counselorId', auth, [
  objectIdParam('counselorId')
], validate, getAppointmentsByCounselor);

router.get('/:id', auth, [
  objectIdParam('id')
], validate, getAppointmentById);

router.patch('/:id/status', auth, [
  objectIdParam('id'),
  body('status').isIn(appointmentStatuses).withMessage('Invalid appointment status'),
  body('notes').optional({ checkFalsy: true }).isLength({ max: 2000 }).withMessage('notes cannot exceed 2000 characters')
], validate, updateAppointmentStatus);

router.delete('/:id', auth, [
  objectIdParam('id')
], validate, deleteAppointment);

module.exports = router;
