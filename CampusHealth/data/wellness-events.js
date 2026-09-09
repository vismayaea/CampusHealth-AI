const svgBanner = (title, subtitle, from, to, accent) => {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="520" viewBox="0 0 1200 520">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${from}"/>
        <stop offset="100%" stop-color="${to}"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#0f172a" flood-opacity="0.18"/>
      </filter>
    </defs>
    <rect width="1200" height="520" rx="0" fill="url(#g)"/>
    <circle cx="1010" cy="120" r="180" fill="#ffffff" opacity="0.12"/>
    <circle cx="170" cy="430" r="210" fill="#ffffff" opacity="0.10"/>
    <path d="M850 385c90-84 161-72 227-144" fill="none" stroke="#ffffff" stroke-width="16" stroke-linecap="round" opacity="0.22"/>
    <g filter="url(#shadow)">
      <rect x="84" y="86" width="640" height="340" rx="34" fill="#ffffff" opacity="0.92"/>
      <rect x="122" y="130" width="118" height="12" rx="6" fill="${accent}" opacity="0.95"/>
      <text x="122" y="214" font-family="Inter, Arial, sans-serif" font-size="54" font-weight="800" fill="#0f172a">${title}</text>
      <text x="122" y="274" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="500" fill="#475569">${subtitle}</text>
      <text x="122" y="350" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="700" fill="${accent}">Campus Wellness Events</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const wellnessEvents = [
  {
    title: 'Managing Exam Anxiety',
    description: 'A practical workshop for students preparing for assessments, covering grounding methods, study-rest planning, and quick anxiety regulation tools.',
    category: 'Exam Wellness',
    image: svgBanner('Managing Exam Anxiety', 'Skills for calmer preparation', '#dbeafe', '#ccfbf1', '#2563eb'),
    speakerName: 'Dr. Meera Iyer',
    speakerDesignation: 'Clinical Psychologist, Student Wellness Centre',
    venue: 'Seminar Hall A, Student Wellness Centre',
    location: 'Student Wellness Centre, North Campus',
    mapDescription: 'Enter through Gate 2, take the corridor beside the library helpdesk, and follow signs to Seminar Hall A.',
    startDate: '2026-08-03T10:00:00+05:30',
    endDate: '2026-08-03T11:30:00+05:30',
    duration: 90,
    capacity: 60,
    status: 'Upcoming',
    agenda: ['Recognising exam anxiety patterns', 'Breathing and grounding practice', 'Building a realistic revision routine', 'Question and answer circle'],
    contactEmail: 'wellness.events@campushealth.edu',
    contactPhone: '+91-80-5550-1201',
    tags: ['exam anxiety', 'stress management', 'students']
  },
  {
    title: 'Mindfulness Meditation Workshop',
    description: 'An introductory guided mindfulness session focused on attention training, body awareness, and simple practices students can use between classes.',
    category: 'Mindfulness',
    image: svgBanner('Mindfulness Meditation', 'A guided campus reset', '#ecfeff', '#e0e7ff', '#0891b2'),
    speakerName: 'Ananya Rao',
    speakerDesignation: 'Mindfulness Facilitator and Counseling Associate',
    venue: 'Wellness Studio, Block C',
    location: 'Block C, Ground Floor',
    mapDescription: 'The studio is opposite the campus clinic reception. Mats will be provided.',
    startDate: '2026-08-06T16:00:00+05:30',
    endDate: '2026-08-06T17:00:00+05:30',
    duration: 60,
    capacity: 35,
    status: 'Upcoming',
    agenda: ['Orientation to mindfulness', 'Guided breathing', 'Body scan practice', 'Take-home practice plan'],
    contactEmail: 'mindfulness@campushealth.edu',
    contactPhone: '+91-80-5550-1202',
    tags: ['mindfulness', 'meditation', 'calm']
  },
  {
    title: 'Yoga for Stress Relief',
    description: 'A beginner-friendly yoga session combining gentle movement, breathwork, and relaxation for students experiencing academic pressure.',
    category: 'Fitness',
    image: svgBanner('Yoga for Stress Relief', 'Gentle movement and breath', '#dcfce7', '#fef3c7', '#16a34a'),
    speakerName: 'Ritika Menon',
    speakerDesignation: 'Certified Yoga Therapist',
    venue: 'Indoor Sports Hall',
    location: 'Sports Complex, East Campus',
    mapDescription: 'Use the east entrance of the Sports Complex. The session area is beside Court 2.',
    startDate: '2026-08-09T07:30:00+05:30',
    endDate: '2026-08-09T08:30:00+05:30',
    duration: 60,
    capacity: 45,
    status: 'Upcoming',
    agenda: ['Mobility warm-up', 'Stress-relief asanas', 'Breath regulation', 'Closing relaxation'],
    contactEmail: 'sportswellness@campushealth.edu',
    contactPhone: '+91-80-5550-1203',
    tags: ['yoga', 'stress relief', 'movement']
  },
  {
    title: 'Sleep Better Challenge',
    description: 'A habit-building session that helps students understand sleep cycles, screen hygiene, and practical routines for better rest.',
    category: 'Self Care',
    image: svgBanner('Sleep Better Challenge', 'Build restorative routines', '#ede9fe', '#dbeafe', '#7c3aed'),
    speakerName: 'Dr. Nikhil Varma',
    speakerDesignation: 'Psychiatrist and Sleep Health Educator',
    venue: 'Lecture Theatre 2',
    location: 'Academic Block 1',
    mapDescription: 'Lecture Theatre 2 is on the first floor, next to the digital learning lab.',
    startDate: '2026-08-12T15:00:00+05:30',
    endDate: '2026-08-12T16:15:00+05:30',
    duration: 75,
    capacity: 80,
    status: 'Upcoming',
    agenda: ['Sleep and mental health basics', 'Common student sleep disruptors', 'Seven-day sleep challenge', 'Reflection worksheet'],
    contactEmail: 'sleepwell@campushealth.edu',
    contactPhone: '+91-80-5550-1204',
    tags: ['sleep hygiene', 'routine', 'self care']
  },
  {
    title: 'Burnout Recovery Session',
    description: 'A recovery-oriented discussion for students balancing academic, internship, and family responsibilities, with emphasis on boundaries and energy management.',
    category: 'Burnout',
    image: svgBanner('Burnout Recovery', 'Reset boundaries and energy', '#fee2e2', '#ffedd5', '#dc2626'),
    speakerName: 'Shreya Kapoor',
    speakerDesignation: 'Counseling Psychologist, Campus Support Team',
    venue: 'Counseling Group Room',
    location: 'Student Wellness Centre, First Floor',
    mapDescription: 'Take the lift to the first floor and turn left toward the group counseling rooms.',
    startDate: '2026-08-17T14:30:00+05:30',
    endDate: '2026-08-17T16:00:00+05:30',
    duration: 90,
    capacity: 30,
    status: 'Upcoming',
    agenda: ['Burnout warning signs', 'Boundary mapping', 'Recovery planning', 'Peer reflection'],
    contactEmail: 'counseling@campushealth.edu',
    contactPhone: '+91-80-5550-1205',
    tags: ['burnout', 'boundaries', 'recovery']
  },
  {
    title: 'Suicide Prevention Awareness',
    description: 'A sensitive awareness program covering warning signs, supportive conversations, referral pathways, and emergency help-seeking on campus.',
    category: 'Awareness',
    image: svgBanner('Suicide Prevention', 'Notice, support, refer', '#fef9c3', '#dcfce7', '#ca8a04'),
    speakerName: 'Dr. Farah Khan',
    speakerDesignation: 'Consultant Psychiatrist and Crisis Intervention Trainer',
    venue: 'Main Auditorium',
    location: 'Central Academic Complex',
    mapDescription: 'Main Auditorium entry is through the central plaza. Accessibility seating is available near the front row.',
    startDate: '2026-08-20T11:00:00+05:30',
    endDate: '2026-08-20T12:30:00+05:30',
    duration: 90,
    capacity: 120,
    status: 'Upcoming',
    agenda: ['Understanding risk signals', 'How to ask and listen safely', 'Campus referral protocol', 'Crisis resources'],
    contactEmail: 'crisis.support@campushealth.edu',
    contactPhone: '+91-80-5550-1206',
    tags: ['suicide prevention', 'crisis support', 'awareness']
  },
  {
    title: 'Building Healthy Relationships',
    description: 'An interactive session on communication, consent, conflict repair, and maintaining supportive friendships and relationships.',
    category: 'Relationships',
    image: svgBanner('Healthy Relationships', 'Communication and boundaries', '#fce7f3', '#e0f2fe', '#db2777'),
    speakerName: 'Kavya Srinivasan',
    speakerDesignation: 'Family Therapist and Student Life Consultant',
    venue: 'Student Activity Centre Room 204',
    location: 'Student Activity Centre',
    mapDescription: 'Room 204 is on the second floor above the student lounge.',
    startDate: '2026-08-24T13:00:00+05:30',
    endDate: '2026-08-24T14:30:00+05:30',
    duration: 90,
    capacity: 50,
    status: 'Upcoming',
    agenda: ['Healthy relationship signals', 'Consent and communication', 'Conflict repair practice', 'Support resources'],
    contactEmail: 'studentlife@campushealth.edu',
    contactPhone: '+91-80-5550-1207',
    tags: ['relationships', 'communication', 'consent']
  },
  {
    title: "Women's Mental Wellness",
    description: 'A supportive circle addressing stress, safety, identity, body image, and help-seeking experiences relevant to women students.',
    category: 'Support Group',
    image: svgBanner("Women's Wellness", 'A supportive student circle', '#fae8ff', '#ffe4e6', '#c026d3'),
    speakerName: 'Dr. Pooja Nair',
    speakerDesignation: 'Clinical Psychologist and Gender Wellness Specialist',
    venue: 'Women’s Resource Centre',
    location: 'Student Services Building',
    mapDescription: 'The centre is on the ground floor near the student services help desk.',
    startDate: '2026-08-27T16:30:00+05:30',
    endDate: '2026-08-27T18:00:00+05:30',
    duration: 90,
    capacity: 35,
    status: 'Upcoming',
    agenda: ['Opening circle', 'Stress and identity discussion', 'Body image and self-compassion', 'Campus support options'],
    contactEmail: 'wrc@campushealth.edu',
    contactPhone: '+91-80-5550-1208',
    tags: ['women wellness', 'support group', 'self compassion']
  },
  {
    title: "Men's Mental Health Circle",
    description: 'A peer-supported counselor-led circle for discussing emotional expression, loneliness, help-seeking, and healthier coping patterns.',
    category: 'Support Group',
    image: svgBanner("Men's Health Circle", 'Talk, listen, support', '#e0f2fe', '#d1fae5', '#0284c7'),
    speakerName: 'Arjun Sen',
    speakerDesignation: 'Counselor and Group Facilitation Specialist',
    venue: 'Peer Support Lounge',
    location: 'Hostel Commons Block',
    mapDescription: 'The lounge is beside the hostel reading room and is marked with Peer Support signage.',
    startDate: '2026-09-01T17:00:00+05:30',
    endDate: '2026-09-01T18:30:00+05:30',
    duration: 90,
    capacity: 28,
    status: 'Upcoming',
    agenda: ['Group norms', 'Stress and masculinity discussion', 'Coping skills exchange', 'When and how to seek help'],
    contactEmail: 'peersupport@campushealth.edu',
    contactPhone: '+91-80-5550-1209',
    tags: ['men mental health', 'peer support', 'coping']
  },
  {
    title: 'Freshers Mental Health Orientation',
    description: 'A welcoming orientation introducing first-year students to mental health basics, campus supports, and ways to build belonging.',
    category: 'Orientation',
    image: svgBanner('Freshers Orientation', 'Belonging starts here', '#ccfbf1', '#fef3c7', '#0f766e'),
    speakerName: 'Campus Wellness Team',
    speakerDesignation: 'Counselors, Peer Supporters, and Student Affairs',
    venue: 'Convention Hall',
    location: 'Central Academic Complex',
    mapDescription: 'Convention Hall is behind the central auditorium, accessible from the main plaza.',
    startDate: '2026-09-04T10:00:00+05:30',
    endDate: '2026-09-04T12:00:00+05:30',
    duration: 120,
    capacity: 150,
    status: 'Upcoming',
    agenda: ['What mental health support looks like', 'Meet the campus wellness team', 'How to book help', 'Student belonging activities'],
    contactEmail: 'orientation@campushealth.edu',
    contactPhone: '+91-80-5550-1210',
    tags: ['freshers', 'orientation', 'campus wellbeing']
  },
  {
    title: 'Digital Detox Weekend',
    description: 'A guided planning session for students who want to reduce doom-scrolling, improve attention, and design a realistic digital detox weekend.',
    category: 'Self Care',
    image: svgBanner('Digital Detox Weekend', 'Reset attention and habits', '#dbeafe', '#f5d0fe', '#4f46e5'),
    speakerName: 'Neel Deshpande',
    speakerDesignation: 'Digital Wellbeing Coach',
    venue: 'Innovation Hub Amphitheatre',
    location: 'Innovation Hub',
    mapDescription: 'The amphitheatre is in the open courtyard behind the Innovation Hub café.',
    startDate: '2026-09-09T15:30:00+05:30',
    endDate: '2026-09-09T16:45:00+05:30',
    duration: 75,
    capacity: 70,
    status: 'Upcoming',
    agenda: ['Attention and phone habits', 'Trigger mapping', 'Detox weekend design', 'Accountability pairs'],
    contactEmail: 'digitalwellbeing@campushealth.edu',
    contactPhone: '+91-80-5550-1211',
    tags: ['digital detox', 'focus', 'habits']
  },
  {
    title: 'Emotional Intelligence Workshop',
    description: 'A skills workshop on naming emotions, responding instead of reacting, and using empathy in teams, classrooms, and placements.',
    category: 'Workshop',
    image: svgBanner('Emotional Intelligence', 'Name, regulate, connect', '#ffedd5', '#e0e7ff', '#ea580c'),
    speakerName: 'Prof. Sameer Kulkarni',
    speakerDesignation: 'Organisational Psychologist and Faculty Mentor',
    venue: 'Learning Lab 3',
    location: 'Academic Block 2',
    mapDescription: 'Learning Lab 3 is on the second floor, left wing, opposite the seminar corridor.',
    startDate: '2026-09-14T14:00:00+05:30',
    endDate: '2026-09-14T16:00:00+05:30',
    duration: 120,
    capacity: 55,
    status: 'Upcoming',
    agenda: ['Emotion vocabulary', 'Regulation before response', 'Empathy in team conflict', 'Practice scenarios'],
    contactEmail: 'learninglab@campushealth.edu',
    contactPhone: '+91-80-5550-1212',
    tags: ['emotional intelligence', 'teams', 'self awareness']
  }
];

module.exports = wellnessEvents;
