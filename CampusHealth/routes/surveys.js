const express = require('express');
const { body, validationResult } = require('express-validator');
const Survey = require('../models/Survey');
const SurveyResponse = require('../models/SurveyResponse');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Counselor: create survey
router.post('/create', auth, [
  body('title').notEmpty(),
  body('questions').isArray({ min: 1 })
], async (req, res) => {
  try {
    if (!['counselor','admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Counselor access required' });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const survey = await Survey.create({
      title: req.body.title,
      description: req.body.description,
      questions: req.body.questions,
      createdBy: req.user._id,
      targetDepartment: req.body.targetDepartment,
      isActive: true
    });
    res.status(201).json({ survey });
  } catch (e) {
    res.status(500).json({ message: 'Failed to create survey' });
  }
});

// Student: list active surveys (optionally filter by department)
router.get('/active', auth, async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.user.department) filter.$or = [{ targetDepartment: req.user.department }, { targetDepartment: { $exists: false } }, { targetDepartment: '' }];
    const surveys = await Survey.find(filter).sort({ createdAt: -1 });
    res.json({ surveys });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch surveys' });
  }
});

// Counselor: list my surveys
router.get('/me', auth, async (req, res) => {
  try {
    if (!['counselor','admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Counselor access required' });
    }
    const surveys = await Survey.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    // Also get response count for each survey
    const surveysWithStats = await Promise.all(surveys.map(async (s) => {
      const count = await SurveyResponse.countDocuments({ survey: s._id });
      return { ...s.toObject(), responseCount: count };
    }));
    res.json({ surveys: surveysWithStats });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch surveys' });
  }
});

// Student: submit survey response
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey || !survey.isActive) return res.status(404).json({ message: 'Survey not found' });
    const response = await SurveyResponse.create({
      survey: survey._id,
      student: req.user._id,
      counselor: survey.createdBy,
      answers: req.body.answers || []
    });
    res.status(201).json({ response });
  } catch (e) {
    res.status(500).json({ message: 'Failed to submit survey' });
  }
});

// Counselor: survey results
router.get('/:id/results', auth, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: 'Survey not found' });
    if (String(survey.createdBy) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const responses = await SurveyResponse.find({ survey: survey._id }).populate('student', 'firstName lastName email');
    res.json({ survey, responses });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch results' });
  }
});

module.exports = router;






