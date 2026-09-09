const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ForumPost = require('../models/ForumPost');
const User = require('../models/User');

// Load environment variables
dotenv.config();

const seedForum = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to DB for seeding forum posts...');

    const user = await User.findOne({ email: 'student@example.com' }) || await User.findOne();
    if (!user) {
      console.log('No user found to set as author. Exiting.');
      process.exit(1);
    }

    const samplePosts = [
      {
        authorId: user._id,
        title: 'Feeling overwhelmed with midterms',
        content: 'I have three midterms next week and I am completely blanking on everything I study. Does anyone have any tips for staying focused without burning out?',
        category: 'academic',
        isAnonymous: true,
        status: 'active',
        tags: ['midterms', 'burnout'],
        likes: [],
        comments: [],
        views: 42
      },
      {
        authorId: user._id,
        title: 'Success story: How I overcame presentation anxiety',
        content: 'I used to get physical panic attacks before public speaking. I finally reached out to a counselor here and started using the 4-7-8 breathing technique. Today I aced my project presentation!',
        category: 'success-stories',
        isAnonymous: false,
        status: 'active',
        tags: ['anxiety', 'public-speaking'],
        likes: [],
        comments: [],
        views: 120
      },
      {
        authorId: user._id,
        title: 'How do you handle homesickness?',
        content: 'This is my first year away from home and I am missing my family a lot. The campus feels so big and lonely sometimes. Any advice on making friends or dealing with this?',
        category: 'general',
        isAnonymous: true,
        status: 'active',
        tags: ['homesick', 'first-year'],
        likes: [],
        comments: [],
        views: 89
      }
    ];

    let count = 0;
    for (const post of samplePosts) {
      const exists = await ForumPost.findOne({ title: post.title });
      if (!exists) {
        await ForumPost.create(post);
        count++;
      }
    }

    console.log(`Seeding complete. Added ${count} new forum posts.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding forum:', error);
    process.exit(1);
  }
};

seedForum();
