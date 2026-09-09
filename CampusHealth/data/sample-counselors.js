const weekdays = (days, startTime, endTime) => days.map((day) => ({
  day,
  startTime,
  endTime,
  isAvailable: true
}));

const sampleCounselors = [
  {
    name: 'Dr. Ananya Mehta',
    email: 'ananya.mehta@example.com',
    phone: '+91 90000 10001',
    qualification: 'PhD Clinical Psychology, MPhil Clinical Psychology',
    specialization: 'Anxiety, depression, and student wellbeing',
    experience: 12,
    languages: ['English', 'Hindi', 'Gujarati'],
    city: 'Ahmedabad',
    status: 'Available',
    availableSlots: weekdays(['Monday', 'Wednesday', 'Friday'], '09:00', '13:00'),
    bio: 'Supports university students with anxiety, low mood, adjustment concerns, and sustainable coping strategies through an empathetic, evidence-informed approach.'
  },
  {
    name: 'Dr. Rohan Iyer',
    email: 'rohan.iyer@example.com',
    phone: '+91 90000 10002',
    qualification: 'PsyD Counseling Psychology, MA Applied Psychology',
    specialization: 'Academic stress and performance anxiety',
    experience: 9,
    languages: ['English', 'Tamil', 'Hindi'],
    city: 'Chennai',
    status: 'Available',
    availableSlots: weekdays(['Tuesday', 'Thursday', 'Saturday'], '10:00', '15:00'),
    bio: 'Works with students navigating academic pressure, procrastination, confidence concerns, and major life transitions using practical and collaborative counseling methods.'
  },
  {
    name: 'Ms. Kavya Nair',
    email: 'kavya.nair@example.com',
    phone: '+91 90000 10003',
    qualification: 'MSc Clinical Psychology, PG Diploma in Counseling',
    specialization: 'Relationships, grief, and emotional resilience',
    experience: 7,
    languages: ['English', 'Malayalam', 'Hindi'],
    city: 'Kochi',
    status: 'Available',
    availableSlots: weekdays(['Monday', 'Tuesday', 'Thursday'], '12:00', '17:00'),
    bio: 'Provides a supportive space for students experiencing relationship difficulties, grief, loneliness, and emotional overwhelm, with a focus on resilience and self-compassion.'
  },
  {
    name: 'Dr. Arjun Kulkarni',
    email: 'arjun.kulkarni@example.com',
    phone: '+91 90000 10004',
    qualification: 'PhD Psychology, MA Counseling Psychology',
    specialization: 'Trauma-informed counseling and stress management',
    experience: 14,
    languages: ['English', 'Marathi', 'Hindi'],
    city: 'Pune',
    status: 'Busy',
    availableSlots: weekdays(['Wednesday', 'Friday'], '14:00', '18:00'),
    bio: 'Offers trauma-informed support for stress, difficult experiences, emotional regulation, and recovery while helping students build safety, agency, and healthy routines.'
  },
  {
    name: 'Ms. Simran Kaur',
    email: 'simran.kaur@example.com',
    phone: '+91 90000 10005',
    qualification: 'MA Counseling Psychology, Certificate in CBT',
    specialization: 'Self-esteem, identity, and young adult transitions',
    experience: 6,
    languages: ['English', 'Hindi', 'Punjabi'],
    city: 'Chandigarh',
    status: 'Available',
    availableSlots: weekdays(['Monday', 'Wednesday', 'Saturday'], '10:00', '14:00'),
    bio: 'Helps young adults explore identity, self-esteem, boundaries, and changing responsibilities through warm, structured, and culturally responsive conversations.'
  },
  {
    name: 'Dr. Neel Banerjee',
    email: 'neel.banerjee@example.com',
    phone: '+91 90000 10006',
    qualification: 'PhD Clinical Psychology, MSc Psychology',
    specialization: 'Mood concerns and behavioral wellbeing',
    experience: 11,
    languages: ['English', 'Bengali', 'Hindi'],
    city: 'Kolkata',
    status: 'Available',
    availableSlots: weekdays(['Tuesday', 'Thursday', 'Friday'], '09:30', '13:30'),
    bio: 'Supports students managing persistent low mood, motivation difficulties, disrupted routines, and behavioral concerns with collaborative, goal-focused care.'
  },
  {
    name: 'Ms. Aditi Rao',
    email: 'aditi.rao@example.com',
    phone: '+91 90000 10007',
    qualification: 'MSc Counseling Psychology, Diploma in Family Therapy',
    specialization: 'Family concerns and interpersonal communication',
    experience: 8,
    languages: ['English', 'Kannada', 'Hindi'],
    city: 'Bengaluru',
    status: 'Available',
    availableSlots: weekdays(['Monday', 'Thursday', 'Saturday'], '11:00', '16:00'),
    bio: 'Works with students on family expectations, communication patterns, conflict, and boundaries while respecting diverse cultural and personal contexts.'
  },
  {
    name: 'Dr. Vikram Reddy',
    email: 'vikram.reddy@example.com',
    phone: '+91 90000 10008',
    qualification: 'PhD Health Psychology, MA Clinical Psychology',
    specialization: 'Sleep, burnout, and lifestyle wellbeing',
    experience: 10,
    languages: ['English', 'Telugu', 'Hindi'],
    city: 'Hyderabad',
    status: 'Busy',
    availableSlots: weekdays(['Tuesday', 'Friday'], '15:00', '19:00'),
    bio: 'Guides students experiencing burnout, sleep disruption, fatigue, and lifestyle imbalance toward realistic routines and healthier patterns of recovery.'
  },
  {
    name: 'Ms. Ishita Sharma',
    email: 'ishita.sharma@example.com',
    phone: '+91 90000 10009',
    qualification: 'MA Applied Psychology, Advanced Diploma in Child Guidance',
    specialization: 'Social anxiety and adjustment to campus life',
    experience: 5,
    languages: ['English', 'Hindi'],
    city: 'New Delhi',
    status: 'Available',
    availableSlots: weekdays(['Monday', 'Tuesday', 'Friday'], '13:00', '18:00'),
    bio: 'Helps students manage social anxiety, homesickness, belonging concerns, and the transition into campus life through practical skills and compassionate support.'
  },
  {
    name: 'Dr. Farhan Siddiqui',
    email: 'farhan.siddiqui@example.com',
    phone: '+91 90000 10010',
    qualification: 'PhD Counseling Psychology, MSc Clinical Psychology',
    specialization: 'Crisis support and emotional regulation',
    experience: 13,
    languages: ['English', 'Hindi', 'Urdu'],
    city: 'Lucknow',
    status: 'Available',
    availableSlots: weekdays(['Wednesday', 'Thursday', 'Saturday'], '09:00', '14:00'),
    bio: 'Provides calm, non-judgmental support during periods of acute distress and helps students strengthen emotional regulation, coping, and help-seeking skills.'
  }
];

module.exports = sampleCounselors;
