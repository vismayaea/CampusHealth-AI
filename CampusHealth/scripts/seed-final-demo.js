const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Counselor = require('../models/Counselor');
const Resource = require('../models/Resource');
const ForumPost = require('../models/ForumPost');
const Screening = require('../models/Screening');
const Appointment = require('../models/Appointment');
const ChatSession = require('../models/ChatSession');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const publicResources = require('../data/public-resources');
const wellnessEvents = require('../data/wellness-events');
const sampleCounselors = require('../data/sample-counselors');

const daysFromNow = (days, hour = 10, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const userSeed = [
  {
    studentId: 'STU001',
    email: 'aarav.mehta@university.edu',
    password: 'password123',
    firstName: 'Aarav',
    lastName: 'Mehta',
    phone: '+91-98765-41001',
    department: 'Computer Science',
    yearOfStudy: '3rd Year',
    preferredLanguage: 'en',
    role: 'student',
    gender: 'male',
    dateOfBirth: '2004-05-15',
    isActive: true
  },
  {
    studentId: 'STU002',
    email: 'priya.sharma@university.edu',
    password: 'password123',
    firstName: 'Priya',
    lastName: 'Sharma',
    phone: '+91-98765-41002',
    department: 'Psychology',
    yearOfStudy: '2nd Year',
    preferredLanguage: 'en',
    role: 'student',
    gender: 'female',
    dateOfBirth: '2005-08-22',
    isActive: true
  },
  {
    studentId: 'STU003',
    email: 'arun.nair@university.edu',
    password: 'password123',
    firstName: 'Arun',
    lastName: 'Nair',
    phone: '+91-98765-41003',
    department: 'Engineering',
    yearOfStudy: '4th Year',
    preferredLanguage: 'en',
    role: 'student',
    gender: 'male',
    dateOfBirth: '2003-12-10',
    isActive: true
  },
  {
    studentId: 'COUN001',
    email: 'ananya.mehta@university.edu',
    password: 'password123',
    firstName: 'Dr. Ananya',
    lastName: 'Mehta',
    phone: '+91-98765-42001',
    department: 'Student Wellness Centre',
    yearOfStudy: 'PhD',
    preferredLanguage: 'en',
    role: 'counselor',
    isActive: true
  },
  {
    studentId: 'COUN002',
    email: 'rohan.iyer@university.edu',
    password: 'password123',
    firstName: 'Dr. Rohan',
    lastName: 'Iyer',
    phone: '+91-98765-42002',
    department: 'Student Wellness Centre',
    yearOfStudy: 'PhD',
    preferredLanguage: 'en',
    role: 'counselor',
    isActive: true
  },
  {
    studentId: 'ADMIN001',
    email: 'admin@university.edu',
    password: 'admin123',
    firstName: 'Campus',
    lastName: 'Administrator',
    phone: '+91-98765-43001',
    department: 'Campus Wellness Administration',
    yearOfStudy: 'PhD',
    preferredLanguage: 'en',
    role: 'admin',
    isActive: true
  }
];

const phqResponses = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself',
  'Trouble concentrating',
  'Moving or speaking slowly',
  'Thoughts of self-harm'
].map((questionText, index) => ({
  questionId: `phq${index + 1}`,
  questionText,
  response: [1, 1, 2, 1, 0, 1, 1, 0, 0][index]
}));

const gadResponses = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid something awful might happen'
].map((questionText, index) => ({
  questionId: `gad${index + 1}`,
  questionText,
  response: [2, 1, 2, 1, 0, 1, 1][index]
}));

async function seedFinalDemo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus-mental-health');
    console.log('Connected to MongoDB');

    await Promise.all([
      User.deleteMany({}),
      Counselor.deleteMany({}),
      Resource.deleteMany({}),
      ForumPost.deleteMany({}),
      Screening.deleteMany({}),
      Appointment.deleteMany({}),
      ChatSession.deleteMany({}),
      Notification.deleteMany({}),
      Activity.deleteMany({})
    ]);

    const users = {};
    for (const data of userSeed) {
      const user = await new User(data).save();
      users[data.studentId] = user;
    }

    const counselorProfiles = [];
    const linkedCounselorUsers = [users.COUN001, users.COUN002];
    for (let index = 0; index < sampleCounselors.length; index += 1) {
      const source = sampleCounselors[index];
      const linkedUser = linkedCounselorUsers[index];
      const counselor = await new Counselor({
        ...source,
        userId: linkedUser?._id,
        email: linkedUser?.email || source.email,
        name: linkedUser ? `${linkedUser.firstName} ${linkedUser.lastName}`.trim() : source.name
      }).save();
      counselorProfiles.push(counselor);
    }

    await Resource.insertMany(publicResources.map((resource) => ({
      ...resource,
      approvedBy: users.ADMIN001._id,
      approvedAt: new Date()
    })));

    const activities = await Activity.insertMany(wellnessEvents.map((event, index) => ({
      ...event,
      startDate: daysFromNow(5 + index * 3, 10 + (index % 5), 0),
      endDate: daysFromNow(5 + index * 3, 11 + (index % 5), 30),
      organizer: users.ADMIN001._id,
      registeredStudents: index < 3 ? [{ student: users.STU001._id, registeredAt: daysFromNow(-1) }] : []
    })));

    await Screening.insertMany([
      {
        userId: users.STU001._id,
        type: 'PHQ-9',
        responses: phqResponses,
        totalScore: 7,
        severity: 'mild',
        recommendations: ['self-help', 'peer-support'],
        isCompleted: true,
        completedAt: daysFromNow(-2),
        followUpRequired: false
      },
      {
        userId: users.STU001._id,
        type: 'GAD-7',
        responses: gadResponses,
        totalScore: 8,
        severity: 'mild',
        recommendations: ['self-help', 'peer-support'],
        isCompleted: true,
        completedAt: daysFromNow(-1),
        followUpRequired: false
      },
      {
        userId: users.STU002._id,
        type: 'PHQ-9',
        responses: phqResponses.map((item, index) => ({ ...item, response: [2, 2, 2, 2, 1, 2, 1, 0, 0][index] })),
        totalScore: 12,
        severity: 'moderate',
        recommendations: ['self-help', 'peer-support', 'counseling'],
        isCompleted: true,
        completedAt: daysFromNow(-4),
        followUpRequired: true,
        followUpDate: daysFromNow(7)
      }
    ]);

    const appointments = await Appointment.insertMany([
      {
        studentId: users.STU001._id,
        counselorId: counselorProfiles[0]._id,
        date: daysFromNow(2, 0, 0),
        time: '10:00',
        duration: 60,
        status: 'Approved',
        notes: 'Discuss exam stress and sleep routine.',
        meetingType: 'online',
        meetingLink: 'https://meet.jit.si/campushealth-aarav-ananya',
        meetingId: 'CH-AARAV-1020',
        meetingPassword: 'calm247'
      },
      {
        studentId: users.STU001._id,
        counselorId: counselorProfiles[1]._id,
        date: daysFromNow(6, 0, 0),
        time: '14:00',
        duration: 60,
        status: 'Pending',
        notes: 'Follow-up on academic workload planning.',
        meetingType: 'in-person',
        roomNumber: '204',
        building: 'Campus Counseling Center',
        floor: 'Second Floor',
        location: 'Student Services Block, near Library Gate'
      },
      {
        studentId: users.STU002._id,
        counselorId: counselorProfiles[0]._id,
        date: daysFromNow(-3, 0, 0),
        time: '11:00',
        duration: 60,
        status: 'Completed',
        notes: 'Initial counseling session completed.',
        meetingType: 'online',
        meetingLink: 'https://meet.jit.si/campushealth-priya-ananya',
        meetingId: 'CH-PRIYA-1180',
        meetingPassword: 'focus321'
      }
    ]);

    await ForumPost.insertMany([
      {
        authorId: users.STU001._id,
        title: 'What helped me prepare calmly for mid-semesters',
        content: 'I started planning revision in 45-minute blocks and used the breathing exercise from the resource library before practice exams. It made the week feel more manageable.',
        category: 'academic',
        tags: ['exam anxiety', 'planning', 'self care'],
        isAnonymous: false,
        isPinned: true,
        status: 'active',
        isApproved: true,
        approvedBy: users.ADMIN001._id,
        approvedAt: new Date(),
        views: 126,
        likes: [users.STU002._id, users.STU003._id],
        comments: [
          {
            authorId: users.COUN001._id,
            content: 'This is a healthy strategy. Pairing revision blocks with short recovery breaks can reduce overload.',
            isAnonymous: false,
            isPinned: true,
            pinnedBy: users.ADMIN001._id
          }
        ],
        language: 'en',
        culturalContext: 'institutional'
      },
      {
        authorId: users.STU002._id,
        title: 'How do you handle homesickness after returning from break?',
        content: 'The first week back on campus always feels emotionally heavy. I would appreciate ideas that have worked for others.',
        category: 'relationships',
        tags: ['homesickness', 'campus life', 'support'],
        isAnonymous: true,
        status: 'active',
        isApproved: true,
        views: 88,
        likes: [users.STU001._id],
        comments: [
          {
            authorId: users.STU003._id,
            content: 'Calling home at a fixed time and joining one evening activity helped me settle again.',
            isAnonymous: false
          }
        ],
        language: 'en',
        culturalContext: 'institutional'
      },
      {
        authorId: users.STU003._id,
        title: 'Small win: I attended my first wellness event',
        content: 'I was nervous, but the mindfulness workshop was welcoming and practical. Sharing in case someone else is hesitating.',
        category: 'success-stories',
        tags: ['wellness activities', 'mindfulness', 'confidence'],
        isAnonymous: false,
        status: 'active',
        isApproved: true,
        views: 143,
        likes: [users.STU001._id, users.STU002._id],
        language: 'en',
        culturalContext: 'institutional'
      }
    ]);

    await ChatSession.create({
      userId: users.STU001._id,
      sessionId: 'demo-session-aarav-001',
      messages: [
        { role: 'assistant', content: 'Hi Aarav, I am here to help you reflect and plan one manageable next step.' },
        { role: 'user', content: 'I feel tense about exams and I am sleeping late.' },
        { role: 'assistant', content: 'That sounds tiring. Try one 10-minute wind-down routine tonight and choose one priority topic for tomorrow morning.' }
      ],
      context: {
        currentMood: 'stressed',
        activeConcerns: ['exam anxiety', 'sleep routine'],
        preferredLanguage: 'en',
        sessionGoals: ['stress-management']
      },
      status: 'active',
      escalationLevel: 'none',
      startedAt: daysFromNow(-1, 20, 0),
      lastActivity: daysFromNow(-1, 20, 8)
    });

    await Notification.insertMany([
      {
        userId: users.STU001._id,
        type: 'appointment_approved',
        title: 'Appointment approved',
        message: `Your session with ${counselorProfiles[0].name} is confirmed for 10:00 AM.`,
        read: false,
        metadata: { appointmentId: appointments[0]._id }
      },
      {
        userId: users.STU001._id,
        type: 'activity_reminder',
        title: 'Activity reminder',
        message: `${activities[0].title} starts soon. Please arrive 10 minutes early.`,
        read: false,
        metadata: { activityId: activities[0]._id }
      },
      {
        userId: users.STU001._id,
        type: 'assessment_completed',
        title: 'Assessment completed',
        message: 'Your GAD-7 result is saved with personalized self-care recommendations.',
        read: true,
        metadata: { type: 'GAD-7' }
      },
      {
        userId: users.STU001._id,
        type: 'forum_reply_received',
        title: 'Counselor replied to your post',
        message: 'A counselor added a supportive response to your exam preparation post.',
        read: false,
        metadata: { source: 'forum' }
      },
      {
        userId: users.COUN001._id,
        type: 'appointment_booked',
        title: 'New appointment request',
        message: 'Aarav Mehta requested a follow-up counseling session.',
        read: false,
        metadata: { appointmentId: appointments[1]._id }
      },
      {
        userId: users.ADMIN001._id,
        type: 'admin_broadcast',
        title: 'Weekly wellbeing summary ready',
        message: 'Engagement, appointments, and activity registrations are ready for review.',
        read: false,
        metadata: { scope: 'weekly-summary' }
      },
      {
        userId: users.ADMIN001._id,
        type: 'forum_post_reported',
        title: 'Moderation queue clear',
        message: 'No urgent forum moderation items require action right now.',
        read: true,
        metadata: { scope: 'forum' }
      }
    ]);

    console.log('Final interview demo data seeded successfully.');
    console.log('Student: aarav.mehta@university.edu / password123');
    console.log('Counselor: ananya.mehta@university.edu / password123');
    console.log('Admin: admin@university.edu / admin123');
  } catch (error) {
    console.error('Failed to seed final demo data:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

if (require.main === module) {
  seedFinalDemo();
}

module.exports = seedFinalDemo;
