const mongoose = require('mongoose');

const counselorAvailabilitySchema = new mongoose.Schema({
  counselorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  slotDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'blocked'],
    default: 'available'
  },
  reason: {
    type: String,
    default: ''
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }
}, {
  timestamps: true
});

counselorAvailabilitySchema.index({ counselorId: 1, slotDate: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('CounselorAvailability', counselorAvailabilitySchema);
