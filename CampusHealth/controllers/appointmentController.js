const mongoose = require('mongoose');
const crypto = require('crypto');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Counselor = require('../models/Counselor');
const { notifyUser } = require('../utils/notificationService');

const { appointmentStatuses } = Appointment;

const blockingStatuses = ['Pending', 'Approved'];
const nonDuplicateStatuses = ['Rejected', 'Cancelled'];
const appointmentStatusTransitions = {
  Pending: ['Approved', 'Rejected', 'Cancelled'],
  Approved: ['Completed', 'Cancelled'],
  Rejected: [],
  Cancelled: [],
  Completed: []
};
const counselorStatusTransitions = {
  Pending: ['Approved', 'Rejected'],
  Approved: ['Completed']
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const isAdmin = (user) => user?.role === 'admin';
const isStudent = (user) => user?.role === 'student';
const isCounselor = (user) => user?.role === 'counselor';
const sameId = (left, right) => String(left || '') === String(right || '');
const isValidStatusTransition = (currentStatus, nextStatus) => (
  appointmentStatusTransitions[currentStatus]?.includes(nextStatus) === true
);

const normalizeDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const getAppointmentStart = (date, time) => {
  const [hours, minutes] = time.split(':').map(Number);
  const start = new Date(date);
  start.setHours(hours, minutes, 0, 0);
  return start;
};

const buildMeetingDetails = (meetingType) => {
  if (meetingType === 'online') {
    const meetingId = `CH-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const meetingPassword = crypto.randomBytes(4).toString('base64url').slice(0, 8);
    return {
      meetingType,
      meetingId,
      meetingPassword,
      meetingLink: `https://meet.jit.si/campushealth-${meetingId.toLowerCase()}`,
      roomNumber: '',
      building: '',
      floor: '',
      location: ''
    };
  }

  return {
    meetingType,
    meetingLink: '',
    meetingId: '',
    meetingPassword: '',
    building: 'Campus Counseling Center',
    floor: 'Second Floor',
    roomNumber: 'Room 204',
    location: 'Student Services Block, beside the main library entrance'
  };
};

const pickAppointmentFields = (body) => ({
  studentId: body.studentId,
  counselorId: body.counselorId,
  date: normalizeDate(body.date),
  time: body.time,
  duration: body.duration ?? 60,
  status: 'Pending',
  notes: body.notes || '',
  ...buildMeetingDetails(body.meetingType)
});

const sendDatabaseUnavailable = (res) => res.status(503).json({
  success: false,
  message: 'Database unavailable'
});

const forbidden = (res, message = 'You are not authorized to access this appointment') => res.status(403).json({
  success: false,
  message
});

const invalidStatusTransition = (res, currentStatus, nextStatus) => res.status(400).json({
  success: false,
  message: `Invalid appointment status transition: ${currentStatus} cannot transition to ${nextStatus}`
});

const ensureDatabase = (res) => {
  if (mongoose.connection.readyState !== 1) {
    sendDatabaseUnavailable(res);
    return false;
  }
  return true;
};

const ensurePersonExists = async (studentId, counselorId) => {
  const [student, counselor] = await Promise.all([
    User.findById(studentId).select('_id name email role isActive'),
    Counselor.findById(counselorId).select('_id name email status')
  ]);

  if (!student) {
    return { ok: false, status: 404, message: 'Student not found' };
  }
  if (student.isActive === false) {
    return { ok: false, status: 400, message: 'Student account is inactive' };
  }
  if (!counselor) {
    return { ok: false, status: 404, message: 'Counselor not found' };
  }
  return { ok: true, student, counselor };
};

const getCounselorProfileForUser = async (user) => {
  if (!user?._id) return null;

  const linkedCounselor = await Counselor.findOne({ userId: user._id }).select('_id userId name email status');
  if (linkedCounselor || !user.email) return linkedCounselor;

  const legacyCounselor = await Counselor.findOne({
    email: String(user.email).trim().toLowerCase(),
    $or: [
      { userId: { $exists: false } },
      { userId: null }
    ]
  }).select('_id userId name email status');
  if (!legacyCounselor) return null;

  legacyCounselor.userId = user._id;
  try {
    await legacyCounselor.save();
    return legacyCounselor;
  } catch (error) {
    if (error?.code === 11000) {
      return Counselor.findOne({ userId: user._id }).select('_id userId name email status');
    }
    throw error;
  }
};

const getAuthorizedAppointmentQuery = async (req, res, requestedQuery = {}) => {
  if (isAdmin(req.user)) {
    return { ok: true, query: { ...requestedQuery } };
  }

  if (isStudent(req.user)) {
    if (requestedQuery.studentId && !sameId(requestedQuery.studentId, req.user._id)) {
      return { ok: false, response: forbidden(res, 'Students can access only their own appointments') };
    }
    if (requestedQuery.counselorId) {
      return { ok: false, response: forbidden(res, 'Students cannot list appointments by counselor') };
    }
    return { ok: true, query: { ...requestedQuery, studentId: req.user._id } };
  }

  if (isCounselor(req.user)) {
    const counselor = await getCounselorProfileForUser(req.user);
    if (!counselor) {
      return { ok: false, response: forbidden(res, 'No counselor profile is linked to this account') };
    }
    if (requestedQuery.counselorId && !sameId(requestedQuery.counselorId, counselor._id)) {
      return { ok: false, response: forbidden(res, 'Counselors can access only their assigned appointments') };
    }
    if (requestedQuery.studentId) {
      return { ok: false, response: forbidden(res, 'Counselors cannot list appointments by student') };
    }
    return { ok: true, query: { ...requestedQuery, counselorId: counselor._id } };
  }

  return { ok: false, response: forbidden(res) };
};

const canAccessAppointment = async (req, appointment) => {
  if (isAdmin(req.user)) return true;
  if (isStudent(req.user)) return sameId(appointment.studentId?._id || appointment.studentId, req.user._id);
  if (isCounselor(req.user)) {
    const counselor = await getCounselorProfileForUser(req.user);
    return counselor && sameId(appointment.counselorId?._id || appointment.counselorId, counselor._id);
  }
  return false;
};

const validateBookingRules = async ({ studentId, counselorId, date, time }) => {
  const appointmentStart = getAppointmentStart(date, time);
  if (appointmentStart <= new Date()) {
    return { ok: false, status: 400, message: 'Cannot book appointments in the past' };
  }

  const people = await ensurePersonExists(studentId, counselorId);
  if (!people.ok) return people;

  const occupiedSlot = await Appointment.findOne({
    counselorId,
    date,
    time,
    status: { $in: blockingStatuses }
  });
  if (occupiedSlot) {
    return { ok: false, status: 409, message: 'This counselor time slot is already occupied' };
  }

  const duplicateAppointment = await Appointment.findOne({
    studentId,
    counselorId,
    date,
    time,
    status: { $nin: nonDuplicateStatuses }
  });
  if (duplicateAppointment) {
    return { ok: false, status: 409, message: 'Duplicate appointment for this student, counselor, date, and time' };
  }

  return { ok: true };
};

const timeToMinutes = (value) => {
  const [hours, minutes] = String(value || '').split(':').map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? (hours * 60) + minutes : null;
};

const minutesToTime = (minutes) => (
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
);

const getAvailableSlotValues = (counselor, date) => {
  const dayName = new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
  const matchingSlots = (counselor.availableSlots || []).filter((slot) => {
    if (slot.isAvailable === false) return false;
    if (slot.date) return normalizeDate(slot.date)?.getTime() === normalizeDate(date)?.getTime();
    return !slot.day || slot.day === dayName;
  });

  const values = [];
  matchingSlots.forEach((slot) => {
    const start = timeToMinutes(slot.startTime);
    const end = timeToMinutes(slot.endTime);
    if (start === null) return;
    if (end !== null && end > start) {
      for (let current = start; current < end; current += 60) {
        values.push(minutesToTime(current));
      }
    } else {
      values.push(minutesToTime(start));
    }
  });
  return [...new Set(values)].sort();
};

const getAppointmentAvailability = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const date = normalizeDate(req.query.date);
    const counselor = await Counselor.findById(req.query.counselorId)
      .select('_id availableSlots status');
    if (!counselor) {
      return res.status(404).json({ success: false, message: 'Counselor not found' });
    }

    const slotValues = getAvailableSlotValues(counselor, req.query.date);
    const booked = await Appointment.find({
      counselorId: counselor._id,
      date,
      status: { $in: blockingStatuses }
    }).distinct('time');
    const bookedSet = new Set(booked);

    return res.json({
      success: true,
      counselorId: counselor._id,
      date,
      slots: slotValues.map((value) => ({
        value,
        booked: bookedSet.has(value),
        available: !bookedSet.has(value)
      }))
    });
  } catch (error) {
    console.error('Get appointment availability error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load appointment availability' });
  }
};

const getAppointments = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;

    const {
      status,
      studentId,
      counselorId,
      page = 1,
      limit = 20,
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (studentId) query.studentId = studentId;
    if (counselorId) query.counselorId = counselorId;

    const authorization = await getAuthorizedAppointmentQuery(req, res, query);
    if (!authorization.ok) return authorization.response;
    const scopedQuery = authorization.query;

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const [appointments, total] = await Promise.all([
      Appointment.find(scopedQuery)
        .populate('studentId', 'name firstName lastName email')
        .populate('counselorId', 'name email specialization status')
        .sort({ date: sortDirection, time: sortDirection, createdAt: sortDirection })
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize),
      Appointment.countDocuments(scopedQuery)
    ]);

    return res.json({
      success: true,
      appointments,
      pagination: {
        current: currentPage,
        pages: Math.ceil(total / pageSize),
        total
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get appointments' });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment id' });
    }

    const appointment = await Appointment.findById(req.params.id)
      .populate('studentId', 'name firstName lastName email')
      .populate('counselorId', 'name email specialization status');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (!(await canAccessAppointment(req, appointment))) {
      return forbidden(res);
    }

    return res.json({ success: true, appointment });
  } catch (error) {
    console.error('Get appointment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get appointment' });
  }
};

const getAppointmentsByStudent = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    if (!isValidObjectId(req.params.studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student id' });
    }

    if (!isAdmin(req.user) && (!isStudent(req.user) || !sameId(req.params.studentId, req.user._id))) {
      return forbidden(res, 'Students can access only their own appointments');
    }

    const appointments = await Appointment.find({ studentId: req.params.studentId })
      .populate('studentId', 'name firstName lastName email')
      .populate('counselorId', 'name email specialization status')
      .sort({ date: -1, time: -1 });

    return res.json({ success: true, appointments });
  } catch (error) {
    console.error('Get student appointments error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get student appointments' });
  }
};

const getAppointmentsByCounselor = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    if (!isValidObjectId(req.params.counselorId)) {
      return res.status(400).json({ success: false, message: 'Invalid counselor id' });
    }

    if (!isAdmin(req.user)) {
      if (!isCounselor(req.user)) {
        return forbidden(res, 'Only counselors and admins can access counselor appointment lists');
      }
      const counselor = await getCounselorProfileForUser(req.user);
      if (!counselor || !sameId(req.params.counselorId, counselor._id)) {
        return forbidden(res, 'Counselors can access only their assigned appointments');
      }
    }

    const appointments = await Appointment.find({ counselorId: req.params.counselorId })
      .populate('studentId', 'name firstName lastName email')
      .populate('counselorId', 'name email specialization status')
      .sort({ date: -1, time: -1 });

    return res.json({ success: true, appointments });
  } catch (error) {
    console.error('Get counselor appointments error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get counselor appointments' });
  }
};

const createAppointment = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;

    if (!isAdmin(req.user)) {
      if (!isStudent(req.user)) {
        return forbidden(res, 'Only students and admins can create appointments');
      }
      if (!sameId(req.body.studentId, req.user._id)) {
        return forbidden(res, 'Students can create appointments only for themselves');
      }
    }

    const appointmentData = pickAppointmentFields(req.body);
    const ruleCheck = await validateBookingRules(appointmentData);
    if (!ruleCheck.ok) {
      return res.status(ruleCheck.status).json({ success: false, message: ruleCheck.message });
    }

    const appointment = await Appointment.create(appointmentData);
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('studentId', 'name firstName lastName email')
      .populate('counselorId', 'userId name email specialization status');

    const counselorUser = await User.findOne({
      ...(populatedAppointment.counselorId.userId
        ? { _id: populatedAppointment.counselorId.userId }
        : { email: String(populatedAppointment.counselorId.email).trim().toLowerCase() }),
      role: 'counselor',
      isActive: true
    }).select('_id').catch((error) => {
      console.error('Counselor notification recipient lookup failed:', error);
      return null;
    });
    await Promise.all([
      notifyUser({
        userId: populatedAppointment.studentId._id,
        type: 'appointment_booked',
        title: 'Appointment booked',
        message: `Your appointment with ${populatedAppointment.counselorId.name} is pending approval.`,
        metadata: { appointmentId: appointment._id }
      }),
      notifyUser({
        userId: counselorUser?._id,
        type: 'appointment_booked',
        title: 'New appointment request',
        message: `${populatedAppointment.studentId.name || populatedAppointment.studentId.firstName || 'A student'} requested an appointment.`,
        metadata: { appointmentId: appointment._id }
      })
    ]);

    return res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      appointment: populatedAppointment
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate appointment' });
    }
    console.error('Create appointment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create appointment' });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment id' });
    }

    const currentAppointment = await Appointment.findById(req.params.id);
    if (!currentAppointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (isStudent(req.user)) {
      if (!sameId(currentAppointment.studentId, req.user._id)) {
        return forbidden(res, 'Students can cancel only their own appointments');
      }
    } else if (isCounselor(req.user)) {
      const counselor = await getCounselorProfileForUser(req.user);
      if (!counselor || !sameId(currentAppointment.counselorId, counselor._id)) {
        return forbidden(res, 'Counselors can update only their assigned appointments');
      }
    } else if (!isAdmin(req.user)) {
      return forbidden(res);
    }

    if (!isValidStatusTransition(currentAppointment.status, req.body.status)) {
      return invalidStatusTransition(res, currentAppointment.status, req.body.status);
    }

    if (isStudent(req.user) && req.body.status !== 'Cancelled') {
      return forbidden(res, 'Students can only cancel appointments');
    }

    if (
      isCounselor(req.user)
      && !counselorStatusTransitions[currentAppointment.status]?.includes(req.body.status)
    ) {
      return forbidden(res, 'Counselors can only approve or reject pending appointments and complete approved appointments');
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: req.body.status,
          ...(req.body.notes !== undefined ? { notes: req.body.notes } : {})
        }
      },
      { new: true, runValidators: true }
    )
      .populate('studentId', 'name firstName lastName email')
      .populate('counselorId', 'name email specialization status');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const statusTypes = {
      Approved: 'appointment_approved',
      Rejected: 'appointment_rejected',
      Cancelled: 'appointment_cancelled',
      Completed: 'appointment_completed'
    };
    if (statusTypes[appointment.status]) {
      await notifyUser({
        userId: appointment.studentId._id,
        type: statusTypes[appointment.status],
        title: `Appointment ${appointment.status.toLowerCase()}`,
        message: `Your appointment with ${appointment.counselorId.name} has been ${appointment.status.toLowerCase()}.`,
        metadata: { appointmentId: appointment._id, status: appointment.status }
      });
    }

    return res.json({
      success: true,
      message: 'Appointment status updated successfully',
      appointment
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update appointment status' });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment id' });
    }

    const currentAppointment = await Appointment.findById(req.params.id);
    if (!currentAppointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (isStudent(req.user)) {
      if (!sameId(currentAppointment.studentId, req.user._id)) {
        return forbidden(res, 'Students can cancel only their own appointments');
      }
      if (!isValidStatusTransition(currentAppointment.status, 'Cancelled')) {
        return invalidStatusTransition(res, currentAppointment.status, 'Cancelled');
      }

      const cancelledAppointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        { $set: { status: 'Cancelled' } },
        { new: true, runValidators: true }
      )
        .populate('studentId', 'name firstName lastName email')
        .populate('counselorId', 'name email specialization status');

      await notifyUser({
        userId: cancelledAppointment.studentId._id,
        type: 'appointment_cancelled',
        title: 'Appointment cancelled',
        message: `Your appointment with ${cancelledAppointment.counselorId.name} has been cancelled.`,
        metadata: { appointmentId: cancelledAppointment._id, status: 'Cancelled' }
      });

      return res.json({
        success: true,
        message: 'Appointment cancelled successfully',
        appointment: cancelledAppointment
      });
    }

    if (isCounselor(req.user)) {
      return forbidden(res, 'Counselors cannot delete appointments');
    }

    if (!isAdmin(req.user)) {
      return forbidden(res);
    }

    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    return res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete appointment' });
  }
};

module.exports = {
  appointmentStatuses,
  createAppointment,
  getAppointments,
  getAppointmentById,
  getAppointmentsByStudent,
  getAppointmentsByCounselor,
  updateAppointmentStatus,
  deleteAppointment,
  getAppointmentAvailability
};
