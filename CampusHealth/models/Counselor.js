const mongoose = require('mongoose');

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const availableSlotSchema = new mongoose.Schema({
  day: {
    type: String,
    trim: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  date: Date,
  startTime: {
    type: String,
    trim: true,
    validate: {
      validator: (value) => !value || timePattern.test(value),
      message: 'startTime must be in HH:mm format'
    }
  },
  endTime: {
    type: String,
    trim: true,
    validate: {
      validator: (value) => !value || timePattern.test(value),
      message: 'endTime must be in HH:mm format'
    }
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const counselorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    sparse: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 120
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  specialization: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160
  },
  qualification: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160
  },
  experience: {
    type: Number,
    required: true,
    min: 0,
    max: 80
  },
  bio: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  languages: {
    type: [String],
    default: []
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  profileImage: {
    type: String,
    trim: true
  },
  availableSlots: {
    type: [availableSlotSchema],
    default: []
  },
  status: {
    type: String,
    enum: ['Available', 'Busy'],
    default: 'Available',
    index: true
  }
}, {
  timestamps: true
});

counselorSchema.index({
  name: 'text',
  specialization: 'text',
  qualification: 'text',
  languages: 'text',
  city: 'text'
});

module.exports = mongoose.model('Counselor', counselorSchema);
