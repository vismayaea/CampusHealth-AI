const publicResources = [
  {
    title: 'Stress: Questions and Answers',
    description: 'A practical overview of stress, its common effects, and everyday steps that can make difficult periods more manageable.',
    content: 'This official World Health Organization resource explains how stress can affect daily life and outlines healthy routines and support options.',
    type: 'article', category: 'stress', duration: 7, author: 'World Health Organization',
    fileUrl: 'https://www.who.int/news-room/questions-and-answers/item/stress',
    tags: ['stress management', 'coping', 'wellbeing'], viewCount: 980
  },
  {
    title: 'Doing What Matters in Times of Stress',
    description: 'An illustrated, evidence-informed guide with short exercises for grounding, difficult thoughts, values, and self-kindness.',
    content: 'This WHO guide presents practical stress-management skills that can be practiced for a few minutes each day.',
    type: 'exercise', category: 'coping-skills', duration: 20, author: 'World Health Organization',
    fileUrl: 'https://www.who.int/publications/i/item/9789240003927',
    tags: ['stress', 'grounding', 'self care', 'resilience'], viewCount: 1250
  },
  {
    title: 'Anxiety Disorders',
    description: 'Clear information about anxiety disorders, common symptoms, risk factors, and evidence-based treatment approaches.',
    content: 'This National Institute of Mental Health overview helps readers recognize when anxiety may require professional support.',
    type: 'article', category: 'anxiety', duration: 10, author: 'National Institute of Mental Health',
    fileUrl: 'https://www.nimh.nih.gov/health/topics/anxiety-disorders',
    tags: ['anxiety', 'symptoms', 'treatment', 'mental health'], viewCount: 1120
  },
  {
    title: 'Depression',
    description: 'An accessible guide to depression signs, contributing factors, treatment options, and ways to find appropriate help.',
    content: 'This NIMH publication provides evidence-based information for people concerned about depression in themselves or someone they know.',
    type: 'article', category: 'depression', duration: 12, author: 'National Institute of Mental Health',
    fileUrl: 'https://www.nimh.nih.gov/health/publications/depression',
    tags: ['depression', 'low mood', 'treatment', 'support'], viewCount: 1040
  },
  {
    title: 'Panic Disorder: What You Need to Know',
    description: 'A guide to panic attacks and panic disorder, including symptoms, diagnosis, treatment, and healthy support-seeking.',
    content: 'This NIMH resource explains the difference between an isolated panic attack and panic disorder and describes established care options.',
    type: 'article', category: 'anxiety', duration: 9, author: 'National Institute of Mental Health',
    fileUrl: 'https://www.nimh.nih.gov/health/publications/panic-disorder-when-fear-overwhelms',
    tags: ['panic attacks', 'anxiety', 'CBT', 'support'], viewCount: 875
  },
  {
    title: 'About Sleep',
    description: 'A concise introduction to healthy sleep, recommended sleep duration, and habits that support better rest.',
    content: 'This Centers for Disease Control and Prevention page summarizes why sleep matters and offers foundations for healthier sleep routines.',
    type: 'article', category: 'general', duration: 6, author: 'Centers for Disease Control and Prevention',
    fileUrl: 'https://www.cdc.gov/sleep/about/index.html',
    tags: ['sleep hygiene', 'rest', 'healthy habits', 'wellbeing'], viewCount: 920
  },
  {
    title: 'Sleep and Health for Students',
    description: 'Student-focused information on how sleep supports concentration, emotional wellbeing, and academic performance.',
    content: 'This CDC resource connects healthy sleep with learning and wellbeing and offers practical guidance relevant to students.',
    type: 'article', category: 'academic', duration: 5, author: 'Centers for Disease Control and Prevention',
    fileUrl: 'https://www.cdc.gov/physical-activity-education/staying-healthy/sleep.html',
    tags: ['students', 'sleep', 'academic wellbeing', 'concentration'], viewCount: 790
  },
  {
    title: 'Adolescent Mental Health Resources',
    description: 'Tools for young people covering stress, resilience, mindfulness, relationships, confidence, and emotional regulation.',
    content: 'UNICEF’s Adolescent Mental Health Hub brings together practical material designed to help young people strengthen everyday wellbeing skills.',
    type: 'article', category: 'academic', duration: 8, author: 'UNICEF',
    fileUrl: 'https://www.unicef.org/adolescentmentalhealthhub/resources/adolescents',
    tags: ['campus wellbeing', 'young people', 'exam anxiety', 'resilience'], viewCount: 840
  },
  {
    title: 'Mental Health Promotion and Prevention',
    description: 'An explanation of how skills, relationships, and supportive environments help young people protect their mental wellbeing.',
    content: 'This UNICEF resource explores proactive mental health support and the role of schools, homes, and communities in helping adolescents thrive.',
    type: 'article', category: 'academic', duration: 7, author: 'UNICEF',
    fileUrl: 'https://www.unicef.org/adolescentmentalhealthhub/what-do-promotion-and-prevention-mean-mental-health',
    tags: ['campus wellbeing', 'prevention', 'students', 'relationships'], viewCount: 650
  },
  {
    title: 'How to Cope with Mental Health Challenges',
    description: 'Small, realistic steps for caring for your body and mind, connecting with support, and getting through difficult days.',
    content: 'This SAMHSA page offers practical self-care and connection ideas while clearly signposting crisis and professional support.',
    type: 'article', category: 'coping-skills', duration: 6, author: 'SAMHSA',
    fileUrl: 'https://www.samhsa.gov/find-support/how-to-cope',
    tags: ['self care', 'coping skills', 'support', 'recovery'], viewCount: 810
  },
  {
    title: 'Mindfulness and Mental Health',
    description: 'An introduction to mindfulness, its potential benefits, ways to practice, and situations where extra care may be appropriate.',
    content: 'The Mental Health Foundation explains mindfulness in plain language and includes balanced guidance for beginning a practice safely.',
    type: 'article', category: 'mindfulness', duration: 10, author: 'Mental Health Foundation',
    fileUrl: 'https://www.mentalhealth.org.uk/explore-mental-health/a-z-topics/mindfulness',
    tags: ['mindfulness', 'meditation', 'anxiety', 'self awareness'], viewCount: 1180
  },
  {
    title: 'Suicide Prevention: Key Facts and Action',
    description: 'Global facts about suicide, risk factors, prevention approaches, and the importance of timely, evidence-based support.',
    content: 'This WHO fact sheet explains suicide as a preventable public-health concern and outlines established prevention priorities.',
    type: 'article', category: 'depression', duration: 8, author: 'World Health Organization',
    fileUrl: 'https://www.who.int/news-room/fact-sheets/detail/suicide',
    tags: ['suicide prevention', 'crisis support', 'public health', 'safety'], viewCount: 720,
    warnings: ['This resource discusses suicide and self-harm. Seek immediate local emergency support if there is imminent danger.']
  },
  {
    title: 'Burn-out: An Occupational Phenomenon',
    description: 'The official WHO explanation of burnout and the work-related dimensions used to describe it.',
    content: 'This WHO page distinguishes occupational burnout from a medical diagnosis and explains the context in which the term should be used.',
    type: 'article', category: 'stress', duration: 5, author: 'World Health Organization',
    fileUrl: 'https://www.who.int/standards/classifications/frequently-asked-questions/burn-out-an-occupational-phenomenon',
    tags: ['burnout', 'workplace wellbeing', 'stress', 'exhaustion'], viewCount: 930
  },
  {
    title: 'Building and Maintaining Healthy Relationships',
    description: 'Practical guidance for strengthening communication, respect, boundaries, and support in close relationships.',
    content: 'This Mental Health Foundation resource explores how healthy connections can support wellbeing and how to care for relationships over time.',
    type: 'article', category: 'relationships', duration: 8, author: 'Mental Health Foundation',
    fileUrl: 'https://www.mentalhealth.org.uk/explore-mental-health/publications/guide-investing-your-relationships',
    tags: ['healthy relationships', 'communication', 'boundaries', 'connection'], viewCount: 760
  }
].map((resource) => ({
  ...resource,
  language: 'en',
  source: 'external',
  difficulty: 'beginner',
  thumbnailUrl: '',
  isActive: true,
  isApproved: true,
  approvedAt: new Date(),
  targetAudience: 'all',
  culturalContext: 'universal',
  rating: { average: 4.6, count: 20 }
}));

module.exports = publicResources;
