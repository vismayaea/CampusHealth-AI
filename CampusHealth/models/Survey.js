const mongoose = require('mongoose');

const surveyQuestionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  type: { type: String, enum: ['single', 'multi', 'scale'], default: 'single' },
  options: [{ type: String }],
  scaleMin: { type: Number, default: 1 },
  scaleMax: { type: Number, default: 5 }
});

const surveySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  questions: { type: [surveyQuestionSchema], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetDepartment: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Survey', surveySchema);






