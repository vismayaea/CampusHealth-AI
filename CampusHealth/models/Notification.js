const mongoose = require('mongoose');

const notificationTypes = [
  'appointment_booked',
  'appointment_approved',
  'appointment_rejected',
  'appointment_cancelled',
  'appointment_completed',
  'activity_registration_confirmed',
  'activity_registration_cancelled',
  'activity_capacity_full',
  'activity_updated',
  'activity_reminder',
  'forum_reply_received',
  'forum_post_liked',
  'forum_post_reported',
  'forum_post_moderated',
  'assessment_reminder',
  'assessment_completed',
  'assessment_high_risk',
  'assessment_result_available',
  'admin_broadcast'
];

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: notificationTypes,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

notificationSchema.statics.types = notificationTypes;

module.exports = mongoose.model('Notification', notificationSchema);
