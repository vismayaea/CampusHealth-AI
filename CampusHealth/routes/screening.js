const express = require('express');
const { body, validationResult } = require('express-validator');
const Screening = require('../models/Screening');
const { auth } = require('../middleware/auth');
const requireDatabase = require('../middleware/requireDatabase');
const { notifyUser } = require('../utils/notificationService');

const router = express.Router();
router.use(requireDatabase);

const expectedQuestionIds = {
  'PHQ-9': Array.from({ length: 9 }, (_, index) => `q${index + 1}`),
  'GAD-7': Array.from({ length: 7 }, (_, index) => `q${index + 1}`)
};

// Get available screening questionnaires
router.get('/questionnaires', auth, async (req, res) => {
  try {
    const questionnaires = [
      {
        id: 'PHQ-9',
        name: 'Patient Health Questionnaire-9',
        description: 'Screens for depression symptoms',
        questions: 9,
        duration: '2-3 minutes',
        languages: ['en', 'hi', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'mr', 'pa', 'ur']
      },
      {
        id: 'GAD-7',
        name: 'Generalized Anxiety Disorder-7',
        description: 'Screens for anxiety symptoms',
        questions: 7,
        duration: '2-3 minutes',
        languages: ['en', 'hi', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'mr', 'pa', 'ur']
      },
      {
        id: 'PSS-10',
        name: 'Perceived Stress Scale-10',
        description: 'Measures perceived stress levels',
        questions: 10,
        duration: '3-4 minutes',
        languages: ['en', 'hi', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'mr', 'pa', 'ur']
      }
    ];

    res.json({ questionnaires });
  } catch (error) {
    console.error('Get questionnaires error:', error);
    res.status(500).json({ message: 'Failed to get questionnaires' });
  }
});

// Get specific questionnaire questions
router.get('/questionnaire/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    const { language = 'en' } = req.query;

    const questions = getQuestionnaireQuestions(type, language);
    
    if (!questions) {
      return res.status(400).json({ message: 'Invalid questionnaire type' });
    }

    res.json({
      type,
      language,
      questions,
      instructions: getQuestionnaireInstructions(type, language)
    });
  } catch (error) {
    console.error('Get questionnaire error:', error);
    res.status(500).json({ message: 'Failed to get questionnaire' });
  }
});

// Submit screening responses
router.post('/submit', auth, [
  body('type').isIn(['PHQ-9', 'GAD-7', 'PSS-10']).withMessage('Invalid questionnaire type'),
  body('responses').isArray().withMessage('Responses must be an array'),
  body('responses.*.questionId').notEmpty().withMessage('Question ID is required'),
  body('responses.*.response').isInt({ min: 0, max: 3 }).withMessage('Response must be between 0-3'),
  body('responses').custom((responses, { req }) => {
    const expectedIds = expectedQuestionIds[req.body.type];
    if (!expectedIds || !Array.isArray(responses)) return true;

    if (responses.length !== expectedIds.length) {
      throw new Error(`${req.body.type} requires exactly ${expectedIds.length} responses`);
    }

    const submittedIds = responses.map((response) => response?.questionId);
    if (submittedIds.some((questionId) => typeof questionId !== 'string' || !questionId.trim())) {
      throw new Error('Every response must include a question ID');
    }

    if (new Set(submittedIds).size !== submittedIds.length) {
      throw new Error('Each question must be answered exactly once; duplicate question IDs are not permitted');
    }

    const unknownId = submittedIds.find((questionId) => !expectedIds.includes(questionId));
    if (unknownId) {
      throw new Error(`Unknown question ID for ${req.body.type}: ${unknownId}`);
    }

    const missingId = expectedIds.find((questionId) => !submittedIds.includes(questionId));
    if (missingId) {
      throw new Error(`Missing required question ID for ${req.body.type}: ${missingId}`);
    }

    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, responses, isAnonymous = false } = req.body;

    // Calculate total score
    const totalScore = responses.reduce((sum, response) => sum + response.response, 0);

    const screening = new Screening({
      userId: isAnonymous ? null : req.user._id,
      type,
      responses,
      totalScore,
      isAnonymous
    });
    screening.severity = screening.calculateSeverity();
    screening.recommendations = screening.generateRecommendations();
    screening.isCompleted = true;
    screening.completedAt = new Date();
    await screening.save();

    if (!isAnonymous) {
      await notifyUser({
        userId: req.user._id,
        type: 'assessment_completed',
        title: 'Assessment completed',
        message: `Your ${type} assessment result is now available.`,
        metadata: { screeningId: screening._id, type, severity: screening.severity }
      });
      if (['moderately-severe', 'severe'].includes(screening.severity)) {
        await notifyUser({
          userId: req.user._id,
          type: 'assessment_high_risk',
          title: 'Please consider immediate support',
          message: 'Your assessment indicates elevated risk. Please contact a counselor or emergency support if you feel unsafe.',
          metadata: { screeningId: screening._id, type, severity: screening.severity }
        });
      }
    }

    // Generate follow-up recommendations
    const recommendations = generateRecommendations(screening, req.user.preferredLanguage);

    res.json({
      message: 'Screening completed successfully',
      results: {
        totalScore,
        severity: screening.severity,
        recommendations: screening.recommendations,
        followUpRecommendations: recommendations,
        followUpRequired: screening.followUpRequired
      }
    });
  } catch (error) {
    console.error('Submit screening error:', error);
    res.status(500).json({ message: 'Failed to submit screening' });
  }
});

// Get user's screening history
router.get('/history', auth, async (req, res) => {
  try {
    const { type, limit = 10, page = 1 } = req.query;
    
    const query = { userId: req.user._id };
    if (type) {
      query.type = type;
    }

    const screenings = await Screening.find(query)
      .sort({ completedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-responses');
    const total = await Screening.countDocuments(query);

    res.json({
      screenings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get screening history error:', error);
    res.status(500).json({ message: 'Failed to get screening history' });
  }
});

// Get specific screening result
router.get('/result/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const screening = await Screening.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!screening) {
      return res.status(404).json({ message: 'Screening not found' });
    }

    res.json({ screening });
  } catch (error) {
    console.error('Get screening result error:', error);
    res.status(500).json({ message: 'Failed to get screening result' });
  }
});

// Helper functions
function getQuestionnaireQuestions(type, language) {
  const questionnaires = {
    'PHQ-9': {
      en: [
        {
          id: 'q1',
          question: "Little interest or pleasure in doing things",
          options: [
            { value: 0, text: "Not at all" },
            { value: 1, text: "Several days" },
            { value: 2, text: "More than half the days" },
            { value: 3, text: "Nearly every day" }
          ]
        },
        {
          id: 'q2',
          question: "Feeling down, depressed, or hopeless",
          options: [
            { value: 0, text: "Not at all" },
            { value: 1, text: "Several days" },
            { value: 2, text: "More than half the days" },
            { value: 3, text: "Nearly every day" }
          ]
        },
        {
          id: 'q3',
          question: "Trouble falling or staying asleep, or sleeping too much",
          options: [
            { value: 0, text: "Not at all" },
            { value: 1, text: "Several days" },
            { value: 2, text: "More than half the days" },
            { value: 3, text: "Nearly every day" }
          ]
        },
        {
          id: 'q4',
          question: "Feeling tired or having little energy",
          options: [
            { value: 0, text: "Not at all" },
            { value: 1, text: "Several days" },
            { value: 2, text: "More than half the days" },
            { value: 3, text: "Nearly every day" }
          ]
        },
        {
          id: 'q5',
          question: "Poor appetite or overeating",
          options: [
            { value: 0, text: "Not at all" },
            { value: 1, text: "Several days" },
            { value: 2, text: "More than half the days" },
            { value: 3, text: "Nearly every day" }
          ]
        },
        {
          id: 'q6',
          question: "Feeling bad about yourself or that you are a failure",
          options: [
            { value: 0, text: "Not at all" },
            { value: 1, text: "Several days" },
            { value: 2, text: "More than half the days" },
            { value: 3, text: "Nearly every day" }
          ]
        },
        {
          id: 'q7',
          question: "Trouble concentrating on things",
          options: [
            { value: 0, text: "Not at all" },
            { value: 1, text: "Several days" },
            { value: 2, text: "More than half the days" },
            { value: 3, text: "Nearly every day" }
          ]
        },
        {
          id: 'q8',
          question: "Moving or speaking so slowly that other people could have noticed, or the opposite",
          options: [
            { value: 0, text: "Not at all" },
            { value: 1, text: "Several days" },
            { value: 2, text: "More than half the days" },
            { value: 3, text: "Nearly every day" }
          ]
        },
        {
          id: 'q9',
          question: "Thoughts that you would be better off dead or of hurting yourself",
          options: [
            { value: 0, text: "Not at all" },
            { value: 1, text: "Several days" },
            { value: 2, text: "More than half the days" },
            { value: 3, text: "Nearly every day" }
          ]
        }
      ],
      hi: [
        {
          id: 'q1',
          question: "चीजें करने में रुचि या खुशी नहीं",
          options: [
            { value: 0, text: "बिल्कुल नहीं" },
            { value: 1, text: "कुछ दिन" },
            { value: 2, text: "आधे से ज्यादा दिन" },
            { value: 3, text: "लगभग हर दिन" }
          ]
        },
        {
          id: 'q2',
          question: "उदास, निराश या निराशाजनक महसूस करना",
          options: [
            { value: 0, text: "बिल्कुल नहीं" },
            { value: 1, text: "कुछ दिन" },
            { value: 2, text: "आधे से ज्यादा दिन" },
            { value: 3, text: "लगभग हर दिन" }
          ]
        },
        {
          id: 'q3',
          question: "सोने में परेशानी या बहुत ज्यादा सोना",
          options: [
            { value: 0, text: "बिल्कुल नहीं" },
            { value: 1, text: "कुछ दिन" },
            { value: 2, text: "आधे से ज्यादा दिन" },
            { value: 3, text: "लगभग हर दिन" }
          ]
        },
        {
          id: 'q4',
          question: "थकान या कम ऊर्जा महसूस करना",
          options: [
            { value: 0, text: "बिल्कुल नहीं" },
            { value: 1, text: "कुछ दिन" },
            { value: 2, text: "आधे से ज्यादा दिन" },
            { value: 3, text: "लगभग हर दिन" }
          ]
        },
        {
          id: 'q5',
          question: "भूख न लगना या ज्यादा खाना",
          options: [
            { value: 0, text: "बिल्कुल नहीं" },
            { value: 1, text: "कुछ दिन" },
            { value: 2, text: "आधे से ज्यादा दिन" },
            { value: 3, text: "लगभग हर दिन" }
          ]
        },
        {
          id: 'q6',
          question: "अपने बारे में बुरा महसूस करना या खुद को असफल समझना",
          options: [
            { value: 0, text: "बिल्कुल नहीं" },
            { value: 1, text: "कुछ दिन" },
            { value: 2, text: "आधे से ज्यादा दिन" },
            { value: 3, text: "लगभग हर दिन" }
          ]
        },
        {
          id: 'q7',
          question: "चीजों पर ध्यान केंद्रित करने में परेशानी",
          options: [
            { value: 0, text: "बिल्कुल नहीं" },
            { value: 1, text: "कुछ दिन" },
            { value: 2, text: "आधे से ज्यादा दिन" },
            { value: 3, text: "लगभग हर दिन" }
          ]
        },
        {
          id: 'q8',
          question: "धीरे-धीरे चलना या बोलना जो दूसरों ने नोटिस किया हो",
          options: [
            { value: 0, text: "बिल्कुल नहीं" },
            { value: 1, text: "कुछ दिन" },
            { value: 2, text: "आधे से ज्यादा दिन" },
            { value: 3, text: "लगभग हर दिन" }
          ]
        },
        {
          id: 'q9',
          question: "मरने या खुद को नुकसान पहुंचाने के विचार",
          options: [
            { value: 0, text: "बिल्कुल नहीं" },
            { value: 1, text: "कुछ दिन" },
            { value: 2, text: "आधे से ज्यादा दिन" },
            { value: 3, text: "लगभग हर दिन" }
          ]
        }
      ]
    },
    'GAD-7': {
      en: [
        {
          id: 'q1',
          question: "Feeling nervous, anxious, or on edge",
          options: [
            { value: 0, text: "Not at all" },
            { value: 1, text: "Several days" },
            { value: 2, text: "More than half the days" },
            { value: 3, text: "Nearly every day" }
          ]
        },
        {
          id: 'q2',
          question: "Not being able to stop or control worrying",
          options: [
            { value: 0, text: "Not at all" },
            { value: 1, text: "Several days" },
            { value: 2, text: "More than half the days" },
            { value: 3, text: "Nearly every day" }
          ]
        },
        {
          id: 'q3',
          question: "Worrying too much about different things",
          options: [
            { value: 0, text: "Not at all" },
            { value: 1, text: "Several days" },
            { value: 2, text: "More than half the days" },
            { value: 3, text: "Nearly every day" }
          ]
        },
        {
          id: 'q4',
          question: "Trouble relaxing",
          options: [
            { value: 0, text: "Not at all" },
            { value: 1, text: "Several days" },
            { value: 2, text: "More than half the days" },
            { value: 3, text: "Nearly every day" }
          ]
        },
        {
          id: 'q5',
          question: "Being so restless that it's hard to sit still",
          options: [
            { value: 0, text: "Not at all" },
            { value: 1, text: "Several days" },
            { value: 2, text: "More than half the days" },
            { value: 3, text: "Nearly every day" }
          ]
        },
        {
          id: 'q6',
          question: "Becoming easily annoyed or irritable",
          options: [
            { value: 0, text: "Not at all" },
            { value: 1, text: "Several days" },
            { value: 2, text: "More than half the days" },
            { value: 3, text: "Nearly every day" }
          ]
        },
        {
          id: 'q7',
          question: "Feeling afraid as if something awful might happen",
          options: [
            { value: 0, text: "Not at all" },
            { value: 1, text: "Several days" },
            { value: 2, text: "More than half the days" },
            { value: 3, text: "Nearly every day" }
          ]
        }
      ],
      hi: [
        {
          id: 'q1',
          question: "नर्वस, चिंतित या तनाव में महसूस करना",
          options: [
            { value: 0, text: "बिल्कुल नहीं" },
            { value: 1, text: "कुछ दिन" },
            { value: 2, text: "आधे से ज्यादा दिन" },
            { value: 3, text: "लगभग हर दिन" }
          ]
        },
        {
          id: 'q2',
          question: "चिंता को रोकने या नियंत्रित करने में असमर्थ होना",
          options: [
            { value: 0, text: "बिल्कुल नहीं" },
            { value: 1, text: "कुछ दिन" },
            { value: 2, text: "आधे से ज्यादा दिन" },
            { value: 3, text: "लगभग हर दिन" }
          ]
        },
        {
          id: 'q3',
          question: "विभिन्न चीजों के बारे में बहुत चिंता करना",
          options: [
            { value: 0, text: "बिल्कुल नहीं" },
            { value: 1, text: "कुछ दिन" },
            { value: 2, text: "आधे से ज्यादा दिन" },
            { value: 3, text: "लगभग हर दिन" }
          ]
        },
        {
          id: 'q4',
          question: "आराम करने में परेशानी",
          options: [
            { value: 0, text: "बिल्कुल नहीं" },
            { value: 1, text: "कुछ दिन" },
            { value: 2, text: "आधे से ज्यादा दिन" },
            { value: 3, text: "लगभग हर दिन" }
          ]
        },
        {
          id: 'q5',
          question: "इतना बेचैन होना कि बैठना मुश्किल हो",
          options: [
            { value: 0, text: "बिल्कुल नहीं" },
            { value: 1, text: "कुछ दिन" },
            { value: 2, text: "आधे से ज्यादा दिन" },
            { value: 3, text: "लगभग हर दिन" }
          ]
        },
        {
          id: 'q6',
          question: "आसानी से चिढ़ जाना या चिड़चिड़ा होना",
          options: [
            { value: 0, text: "बिल्कुल नहीं" },
            { value: 1, text: "कुछ दिन" },
            { value: 2, text: "आधे से ज्यादा दिन" },
            { value: 3, text: "लगभग हर दिन" }
          ]
        },
        {
          id: 'q7',
          question: "डर लगना कि कुछ भयानक हो सकता है",
          options: [
            { value: 0, text: "बिल्कुल नहीं" },
            { value: 1, text: "कुछ दिन" },
            { value: 2, text: "आधे से ज्यादा दिन" },
            { value: 3, text: "लगभग हर दिन" }
          ]
        }
      ]
    }
  };

  return questionnaires[type]?.[language] || questionnaires[type]?.en || null;
}

function getQuestionnaireInstructions(type, language) {
  const instructions = {
    en: {
      'PHQ-9': "Over the last 2 weeks, how often have you been bothered by any of the following problems?",
      'GAD-7': "Over the last 2 weeks, how often have you been bothered by the following problems?",
      'PSS-10': "In the last month, how often have you felt or thought this way?"
    },
    hi: {
      'PHQ-9': "पिछले 2 हफ्तों में, आपको निम्नलिखित समस्याओं में से किसी से कितनी बार परेशानी हुई है?",
      'GAD-7': "पिछले 2 हफ्तों में, आपको निम्नलिखित समस्याओं से कितनी बार परेशानी हुई है?",
      'PSS-10': "पिछले महीने में, आपने कितनी बार इस तरह महसूस किया या सोचा है?"
    }
  };

  return instructions[language]?.[type] || instructions.en[type] || '';
}

function generateRecommendations(screening, language) {
  const recommendations = {
    en: {
      minimal: [
        "Continue maintaining your current self-care practices",
        "Consider regular check-ins with the chatbot",
        "Explore our resource library for wellness tips"
      ],
      mild: [
        "Try our guided meditation and breathing exercises",
        "Consider joining peer support discussions",
        "Schedule a check-in with our chatbot weekly"
      ],
      moderate: [
        "Consider scheduling an appointment with a counselor",
        "Join our peer support forum for shared experiences",
        "Try our stress management resources"
      ],
      'moderately-severe': [
        "We recommend scheduling an appointment with a counselor soon",
        "Consider reaching out to our emergency support",
        "Use our crisis intervention resources"
      ],
      severe: [
        "Please contact emergency services immediately",
        "Reach out to our crisis counselor",
        "Consider immediate professional help"
      ]
    },
    hi: {
      minimal: [
        "अपनी वर्तमान आत्म-देखभाल प्रथाओं को जारी रखें",
        "चैटबॉट के साथ नियमित जांच पर विचार करें",
        "कल्याण युक्तियों के लिए हमारे संसाधन पुस्तकालय का अन्वेषण करें"
      ],
      mild: [
        "हमारे निर्देशित ध्यान और सांस लेने के व्यायाम आजमाएं",
        "साझा अनुभवों के लिए सहकर्मी सहायता चर्चाओं में शामिल हों",
        "साप्ताहिक चैटबॉट जांच शेड्यूल करें"
      ],
      moderate: [
        "एक काउंसलर के साथ अपॉइंटमेंट शेड्यूल करने पर विचार करें",
        "साझा अनुभवों के लिए हमारे सहकर्मी सहायता फोरम में शामिल हों",
        "हमारे तनाव प्रबंधन संसाधनों को आजमाएं"
      ],
      'moderately-severe': [
        "हम जल्दी एक काउंसलर के साथ अपॉइंटमेंट शेड्यूल करने की सलाह देते हैं",
        "हमारी आपातकालीन सहायता से संपर्क करने पर विचार करें",
        "हमारे संकट हस्तक्षेप संसाधनों का उपयोग करें"
      ],
      severe: [
        "कृपया तुरंत आपातकालीन सेवाओं से संपर्क करें",
        "हमारे संकट काउंसलर से संपर्क करें",
        "तत्काल पेशेवर मदद पर विचार करें"
      ]
    }
  };

  return recommendations[language]?.[screening.severity] || recommendations.en[screening.severity] || [];
}

module.exports = router;
