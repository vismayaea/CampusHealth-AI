const express = require('express');
const { body, validationResult } = require('express-validator');
const ChatSession = require('../models/ChatSession');
const { auth } = require('../middleware/auth');
const requireDatabase = require('../middleware/requireDatabase');
const { v4: uuidv4 } = require('uuid');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();
router.use(requireDatabase);
const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Initialize chat session
router.post('/start-session', auth, async (req, res) => {
  try {
    const { context } = req.body;
    
    const sessionId = uuidv4();
    const greeting = getGreetingMessage(req.user.preferredLanguage, context?.currentMood);
    const session = new ChatSession({
      userId: req.user._id,
      sessionId,
      context: {
        currentMood: context?.currentMood || 'neutral',
        lastScreening: context?.lastScreening || null,
        activeConcerns: context?.activeConcerns || [],
        preferredLanguage: req.user.preferredLanguage || 'en',
        sessionGoals: context?.sessionGoals || []
      },
      isAnonymous: req.body.isAnonymous || false
    });
    await session.save();
    await session.addMessage({
      role: 'assistant',
      content: greeting,
      metadata: {
        messageType: 'text'
      }
    });

    res.json({
      sessionId,
      message: greeting,
      session: session
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ message: 'Failed to start chat session' });
  }
});

// Send message to chatbot
router.post('/message', auth, [
  body('sessionId').notEmpty().withMessage('Session ID is required'),
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId, message } = req.body;
    
    const session = await ChatSession.findOne({
      sessionId,
      userId: req.user._id,
      status: 'active'
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found or inactive' });
    }

    await session.addMessage({
      role: 'user',
      content: message,
      metadata: {
        messageType: 'text'
      }
    });

    // Generate AI response
    const response = await generateAIResponse(message, session, req.user);
    
    await session.addMessage({
      role: 'assistant',
      content: response.content,
      metadata: response.metadata
    });
    const escalationLevel = checkEscalationNeeds(message, session);
    if (escalationLevel !== 'none') {
      session.escalationLevel = escalationLevel;
      await session.save();
    }

    res.json({
      message: response.content,
      response: response.content,
      metadata: response.metadata,
      escalationLevel: session.escalationLevel,
      suggestions: response.suggestions || []
    });
  } catch (error) {
    console.error('Chat message error:', error);
    res.status(503).json({
      message: 'I’m having trouble replying right now. Please try again in a moment.',
      retryable: true
    });
  }
});

// Get conversation history
router.get('/sessions', auth, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user._id })
      .sort({ lastActivity: -1, updatedAt: -1 })
      .limit(20)
      .select('sessionId messages status escalationLevel lastActivity startedAt endedAt')
      .lean();

    res.json({
      sessions: sessions.map((session) => {
        const lastMessage = session.messages?.[session.messages.length - 1];
        return {
          sessionId: session.sessionId,
          status: session.status,
          escalationLevel: session.escalationLevel,
          lastActivity: session.lastActivity || session.startedAt,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          preview: lastMessage?.content || 'New conversation',
          messageCount: session.messages?.length || 0
        };
      })
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ message: 'Failed to get conversation history' });
  }
});

// Get chat history
router.get('/session/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await ChatSession.findOne({
      sessionId,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json({ session });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ message: 'Failed to get session' });
  }
});

// End chat session
router.post('/end-session', auth, [
  body('sessionId').notEmpty().withMessage('Session ID is required')
], async (req, res) => {
  try {
    const { sessionId, feedback } = req.body;
    
    const session = await ChatSession.findOne({
      sessionId,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.status = 'completed';
    session.endedAt = new Date();
    
    if (feedback) {
      session.counselorNotes = feedback;
    }

    await session.save();

    res.json({ message: 'Session ended successfully' });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ message: 'Failed to end session' });
  }
});

// Trigger screening
router.post('/trigger-screening', auth, [
  body('sessionId').notEmpty().withMessage('Session ID is required'),
  body('screeningType').isIn(['PHQ-9', 'GAD-7', 'PSS-10']).withMessage('Invalid screening type')
], async (req, res) => {
  try {
    const { sessionId, screeningType } = req.body;
    
    const session = await ChatSession.findOne({
      sessionId,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const screeningQuestions = getScreeningQuestions(screeningType, req.user.preferredLanguage);
    
    await session.addMessage({
      role: 'assistant',
      content: `I'd like to help you better by understanding how you're feeling. Let's do a quick ${screeningType} assessment.`,
      metadata: {
        messageType: 'screening_prompt',
        screeningType
      }
    });

    res.json({
      screeningType,
      questions: screeningQuestions,
      message: 'Screening questions prepared'
    });
  } catch (error) {
    console.error('Trigger screening error:', error);
    res.status(500).json({ message: 'Failed to trigger screening' });
  }
});

// Helper functions
function getGreetingMessage(language, mood) {
  const greetings = {
    en: {
      neutral: "Hello! I'm here to support you. How are you feeling today?",
      sad: "I can sense you might be going through a difficult time. I'm here to listen and help. What's on your mind?",
      anxious: "I understand you might be feeling anxious. Take a deep breath. I'm here to help you work through this.",
      stressed: "It sounds like you're dealing with a lot right now. Let's talk about what's causing you stress."
    },
    hi: {
      neutral: "नमस्ते! मैं आपकी सहायता के लिए यहाँ हूँ। आज आप कैसा महसूस कर रहे हैं?",
      sad: "मुझे लगता है कि आप एक कठिन समय से गुज़र रहे हैं। मैं यहाँ सुनने और मदद करने के लिए हूँ।",
      anxious: "मैं समझता हूँ कि आप चिंतित महसूस कर रहे हैं। गहरी सांस लें। मैं आपकी मदद करूंगा।",
      stressed: "लगता है आप बहुत तनाव में हैं। आइए बात करते हैं कि क्या आपको परेशान कर रहा है।"
    }
  };

  return greetings[language]?.[mood] || greetings.en.neutral;
}

function generateRuleBasedResponse(message, language) {
  const responses = {
    en: {
      greeting: "Hello! I'm here to help you with your mental health concerns. What would you like to talk about?",
      anxiety: "I understand you're feeling anxious. Let's try some breathing exercises together. Would you like me to guide you through a 4-7-8 breathing technique?",
      depression: "I hear that you're feeling down. It's important to remember that these feelings are valid and temporary. Have you been able to maintain your daily routines?",
      stress: "Stress can be overwhelming. Let's break down what's causing you stress and work on some coping strategies. What's the main source of your stress right now?",
      positive: "I'm glad to hear you're doing okay. Would you like to share what's been going well, or is there anything you'd like support with today?",
      notWell: "I'm sorry you’re not feeling well. Is this more about your body (like fever, headache, stomach issues) or more about your emotions (like stress, anxiety, sadness)?",
      tired: "That sounds exhausting. Have you been sleeping okay lately, and is anything in particular draining you (studies, relationships, family, health)?",
      lonely: "I’m sorry you’re feeling alone. Do you have someone you trust you could message right now, or would you like to talk here about what’s been making you feel isolated?",
      angry: "It makes sense to feel angry when something feels unfair or overwhelming. What happened that triggered this feeling?",
      default: "I'm here to listen and support you. Can you tell me more about what you're experiencing right now?"
    },
    hi: {
      greeting: "नमस्ते! मैं आपकी मानसिक स्वास्थ्य संबंधी चिंताओं में आपकी मदद करने के लिए यहाँ हूँ। आप किस बारे में बात करना चाहेंगे?",
      anxiety: "मैं समझता हूँ कि आप चिंतित महसूस कर रहे हैं। आइए कुछ सांस लेने के व्यायाम करते हैं। क्या आप चाहेंगे कि मैं आपको 4-7-8 श्वास तकनीक समझाऊँ?",
      depression: "मैं सुन रहा हूँ कि आप उदास महसूस कर रहे हैं। यह याद रखना महत्वपूर्ण है कि ये भावनाएं वैध हैं। क्या आप अपनी दिनचर्या बनाए रख पा रहे हैं?",
      stress: "तनाव अभिभूत करने वाला हो सकता है। आइए देखते हैं कि क्या आपको तनाव दे रहा है और कुछ उपाय खोजते हैं। अभी आपका सबसे बड़ा तनाव किस बात का है?",
      positive: "यह सुनकर अच्छा लगा कि आप ठीक हैं। क्या आप बताना चाहेंगे कि क्या अच्छा चल रहा है, या आज आप किस चीज़ में सहायता चाहते हैं?",
      notWell: "मुझे सुनकर दुख हुआ कि आप अच्छा महसूस नहीं कर रहे हैं। क्या यह शारीरिक समस्या है (जैसे बुखार/सिरदर्द/पेट) या भावनात्मक (जैसे तनाव/चिंता/उदासी)?",
      tired: "यह थकाने वाला लग रहा है। क्या आपकी नींद ठीक हो रही है, और आपको सबसे ज़्यादा क्या थका रहा है (पढ़ाई, रिश्ते, परिवार, स्वास्थ्य)?",
      lonely: "मुझे खेद है कि आप अकेला महसूस कर रहे हैं। क्या आप किसी भरोसेमंद व्यक्ति को अभी संदेश कर सकते हैं, या यहाँ बात करना चाहेंगे कि आपको ऐसा क्यों लग रहा है?",
      angry: "जब चीज़ें बहुत भारी या अनुचित लगती हैं, तो गुस्सा आना स्वाभाविक है। ऐसा क्या हुआ जिसने यह भावना बढ़ाई?",
      default: "मैं यहाँ आपकी बात सुनने और आपका समर्थन करने के लिए हूँ। क्या आप थोड़ा और बता सकते हैं कि आप अभी क्या महसूस कर रहे हैं?"
    }
  };

  const langResponses = responses[language] || responses.en;
  const messageLower = (message || '').toLowerCase();
  let response = langResponses.default;

  if (messageLower.includes('hello') || messageLower.includes('hi') || messageLower.includes('नमस्ते')) {
    response = langResponses.greeting;
  } else if (
    messageLower.includes('not feeling well') ||
    messageLower.includes('not well') ||
    messageLower.includes("don't feel well") ||
    messageLower.includes('feel sick') ||
    messageLower.includes('sick') ||
    messageLower.includes('ill') ||
    messageLower.includes('unwell') ||
    messageLower.includes('ache') ||
    messageLower.includes('pain') ||
    messageLower.includes('fever') ||
    messageLower.includes('headache') ||
    messageLower.includes('nausea') ||
    messageLower.includes('dizzy') ||
    messageLower.includes('थीक नहीं') ||
    messageLower.includes('ठीक नहीं') ||
    messageLower.includes('बीमार')
  ) {
    response = langResponses.notWell;
  } else if (
    messageLower.includes('tired') ||
    messageLower.includes('exhausted') ||
    messageLower.includes('burnout') ||
    messageLower.includes('burned out') ||
    messageLower.includes('थका') ||
    messageLower.includes('थक')
  ) {
    response = langResponses.tired;
  } else if (
    messageLower.includes('lonely') ||
    messageLower.includes('alone') ||
    messageLower.includes('isolated') ||
    messageLower.includes('अकेला') ||
    messageLower.includes('अकेली')
  ) {
    response = langResponses.lonely;
  } else if (
    messageLower.includes('angry') ||
    messageLower.includes('mad') ||
    messageLower.includes('furious') ||
    messageLower.includes('गुस्सा') ||
    messageLower.includes('क्रोध')
  ) {
    response = langResponses.angry;
  } else if (messageLower.includes('anxious') || messageLower.includes('worry') || messageLower.includes('चिंता')) {
    response = langResponses.anxiety;
  } else if (messageLower.includes('sad') || messageLower.includes('depressed') || messageLower.includes('उदास')) {
    response = langResponses.depression;
  } else if (messageLower.includes('stress') || messageLower.includes('pressure') || messageLower.includes('तनाव')) {
    response = langResponses.stress;
  } else if (
    messageLower.includes('good') ||
    messageLower.includes('fine') ||
    messageLower.includes('okay') ||
    messageLower.includes('great') ||
    messageLower.includes('ठीक') ||
    messageLower.includes('अच्छा')
  ) {
    response = langResponses.positive;
  }

  return response;
}

async function generateAIResponse(message, session, user) {
  const language = user.preferredLanguage || 'en';
  const systemPrompt =
    "You are a supportive, clinically-informed campus mental health assistant for Indian college students. " +
    "Answer clearly and helpfully. Avoid diagnosing or giving emergency instructions; instead, encourage seeking professional help when needed. " +
    `Respond in the user's preferred language (language code: ${language}).`;
  let previousMessages = (session.messages || []).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content
  }));

  const last = previousMessages[previousMessages.length - 1];
  if (last?.role === 'user' && last?.content === message) {
    previousMessages = previousMessages.slice(0, -1);
  }

  if (geminiClient) {
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const model = geminiClient.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt
    });

    const history = [];
    for (const m of previousMessages) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      const text = String(m.content || '').trim();
      if (!text) continue;
      if (history.length === 0 && role === 'model') continue;

      const previous = history[history.length - 1];
      if (previous?.role === role) {
        previous.parts[0].text = `${previous.parts[0].text}\n\n${text}`;
      } else {
        history.push({ role, parts: [{ text }] });
      }
    }

    try {
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(message);
      const text = result?.response?.text?.();
      return {
        content: text || generateRuleBasedResponse(message, language),
        metadata: {
          messageType: 'text',
          provider: 'gemini',
          suggestions: getSuggestions(language)
        }
      };
    } catch (err) {
      console.error('Gemini request failed. Falling back to rule-based response.', err.message);
      return {
        content: `${generateRuleBasedResponse(message, language)}\n\n_Note: I could not reach the AI service, so I used a safe fallback response._`,
        metadata: {
          messageType: 'text',
          provider: 'fallback',
          aiError: true,
          suggestions: getSuggestions(language)
        }
      };
    }
  }

  return {
    content: `${generateRuleBasedResponse(message, language)}\n\n_Set GEMINI_API_KEY on the server to enable AI-generated replies._`,
    metadata: {
      messageType: 'text',
      provider: 'fallback',
      suggestions: getSuggestions(language)
    }
  };
}

function getSuggestions(language) {
  const suggestions = {
    en: [
      "I'd like to talk about my feelings",
      "Can you help me with stress management?",
      "I need help with anxiety",
      "I want to learn coping strategies"
    ],
    hi: [
      "मैं अपनी भावनाओं के बारे में बात करना चाहता हूँ",
      "क्या आप तनाव प्रबंधन में मेरी मदद कर सकते हैं?",
      "मुझे चिंता के साथ मदद चाहिए",
      "मैं सामना करने की रणनीतियाँ सीखना चाहता हूँ"
    ]
  };

  return suggestions[language] || suggestions.en;
}

function checkEscalationNeeds(message, session) {
  const urgentKeywords = ['suicide', 'kill myself', 'end it all', 'not worth living', 'self harm', 'hurt myself'];
  const highKeywords = ['can\'t cope', 'overwhelmed', 'hopeless', 'desperate', 'emergency'];
  
  const messageLower = message.toLowerCase();
  
  if (urgentKeywords.some(keyword => messageLower.includes(keyword))) {
    return 'emergency';
  } else if (highKeywords.some(keyword => messageLower.includes(keyword))) {
    return 'urgent';
  }
  
  return 'none';
}

function getScreeningQuestions(type, language) {
  const questions = {
    'PHQ-9': {
      en: [
        "Little interest or pleasure in doing things",
        "Feeling down, depressed, or hopeless",
        "Trouble falling or staying asleep, or sleeping too much",
        "Feeling tired or having little energy",
        "Poor appetite or overeating",
        "Feeling bad about yourself or that you are a failure",
        "Trouble concentrating on things",
        "Moving or speaking so slowly that other people could have noticed, or the opposite",
        "Thoughts that you would be better off dead or of hurting yourself"
      ],
      hi: [
        "चीजें करने में रुचि या खुशी नहीं",
        "उदास, निराश या निराशाजनक महसूस करना",
        "सोने में परेशानी या बहुत ज्यादा सोना",
        "थकान या कम ऊर्जा महसूस करना",
        "भूख न लगना या ज्यादा खाना",
        "अपने बारे में बुरा महसूस करना",
        "चीजों पर ध्यान केंद्रित करने में परेशानी",
        "धीरे-धीरे चलना या बोलना",
        "मरने या खुद को नुकसान पहुंचाने के विचार"
      ]
    },
    'GAD-7': {
      en: [
        "Feeling nervous, anxious, or on edge",
        "Not being able to stop or control worrying",
        "Worrying too much about different things",
        "Trouble relaxing",
        "Being so restless that it's hard to sit still",
        "Becoming easily annoyed or irritable",
        "Feeling afraid as if something awful might happen"
      ],
      hi: [
        "नर्वस, चिंतित या तनाव में महसूस करना",
        "चिंता को रोकने या नियंत्रित करने में असमर्थ होना",
        "विभिन्न चीजों के बारे में बहुत चिंता करना",
        "आराम करने में परेशानी",
        "बेचैन होना",
        "आसानी से चिढ़ जाना",
        "डर लगना कि कुछ भयानक हो सकता है"
      ]
    }
  };

  return questions[type]?.[language] || questions[type]?.en || [];
}

module.exports = router;
