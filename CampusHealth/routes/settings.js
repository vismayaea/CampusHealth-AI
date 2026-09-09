const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const requireDatabase = require('../middleware/requireDatabase');

const router = express.Router();
router.use(requireDatabase);
router.use(auth);

const defaults = { theme: 'light', fontSize: 'medium' };

router.get('/', (req, res) => {
  res.json({ settings: { ...defaults, ...(req.user.preferences?.appearance || {}) } });
});

router.put('/', [
  body('theme').isIn(['light', 'dark', 'highContrast']).withMessage('Invalid theme'),
  body('fontSize').isIn(['small', 'medium', 'large']).withMessage('Invalid font size')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    req.user.preferences = {
      ...(req.user.preferences?.toObject?.() || req.user.preferences || {}),
      appearance: {
        theme: req.body.theme,
        fontSize: req.body.fontSize
      }
    };
    await req.user.save();

    return res.json({
      message: 'Settings saved successfully',
      settings: req.user.preferences.appearance
    });
  } catch (error) {
    return res.status(500).json({ message: 'Settings could not be saved' });
  }
});

module.exports = router;
