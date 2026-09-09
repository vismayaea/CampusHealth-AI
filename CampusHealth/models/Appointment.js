const mongoose = require('mongoose');

const appointmentStatuses = ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'];
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const appointmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  counselorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Counselor',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  time: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (value) => timePattern.test(value),
      message: 'time must be in HH:mm format'
    }
  },
  duration: {
    type: Number,
    default: 60,
    min: 15,
    max: 240
  },
  status: {
    type: String,
    enum: appointmentStatuses,
    default: 'Pending',
    index: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: ''
  },
  meetingType: {
    type: String,
    enum: ['online', 'in-person'],
    required: true
  },
  meetingLink: {
    type: String,
    trim: true,
    default: ''
  },
  meetingId: {
    type: String,
    trim: true,
    default: ''
  },
  meetingPassword: {
    type: String,
    trim: true,
    default: ''
  },
  roomNumber: {
    type: String,
    trim: true,
    default: ''
  },
  building: {
    type: String,
    trim: true,
    default: ''
  },
  floor: {
    type: String,
    trim: true,
    default: ''
  },
  location: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: { createdAt: true, updatedAt: true }
});

appointmentSchema.index({ studentId: 1, counselorId: 1, date: 1, time: 1 });
appointmentSchema.index({ counselorId: 1, date: 1, time: 1, status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
module.exports.appointmentStatuses = appointmentStatuses;
