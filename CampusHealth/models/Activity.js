const mongoose = require('mongoose');

const activityRegistrationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const activitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  image: {
    type: String,
    default: ''
  },
  speakerName: {
    type: String,
    trim: true,
    default: ''
  },
  speakerDesignation: {
    type: String,
    trim: true,
    default: ''
  },
  venue: {
    type: String,
    trim: true,
    default: ''
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  mapDescription: {
    type: String,
    trim: true,
    default: ''
  },
  duration: {
    type: Number,
    min: 15,
    max: 480,
    default: 60
  },
  agenda: {
    type: [String],
    default: []
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  contactPhone: {
    type: String,
    trim: true,
    default: ''
  },
  tags: {
    type: [String],
    default: []
  },
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  registeredStudents: {
    type: [activityRegistrationSchema],
    default: []
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Upcoming',
    index: true
  }
}, { timestamps: true });

activitySchema.index({
  title: 'text',
  description: 'text',
  location: 'text',
  venue: 'text',
  speakerName: 'text',
  speakerDesignation: 'text',
  tags: 'text'
});
activitySchema.index({ startDate: 1, category: 1, status: 1 });

activitySchema.virtual('registeredCount').get(function() {
  return this.registeredStudents?.length || 0;
});

activitySchema.virtual('availableSeats').get(function() {
  return Math.max(0, this.capacity - (this.registeredStudents?.length || 0));
});

activitySchema.set('toJSON', { virtuals: true });
activitySchema.set('toObject', { virtuals: true });

activitySchema.pre('validate', function(next) {
  if (!this.venue && this.location) {
    this.venue = this.location;
  }
  if (!this.location && this.venue) {
    this.location = this.venue;
  }
  if (Array.isArray(this.agenda)) {
    this.agenda = this.agenda.map((item) => String(item).trim()).filter(Boolean);
  }
  if (Array.isArray(this.tags)) {
    this.tags = [...new Set(this.tags.map((item) => String(item).trim()).filter(Boolean))];
  }
  if (this.endDate && this.startDate && this.endDate < this.startDate) {
    this.invalidate('endDate', 'End date must be after start date');
  }
  next();
});

module.exports = mongoose.model('Activity', activitySchema);
