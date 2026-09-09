const mongoose = require('mongoose');
require('dotenv').config();

const Activity = require('../models/Activity');
const User = require('../models/User');
const wellnessEvents = require('../data/wellness-events');

async function seedActivities() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-mental-health');
    console.log('Connected to MongoDB');

    const organizer = await User.findOne({ role: { $in: ['admin', 'counselor', 'peer_supporter'] }, isActive: { $ne: false } })
      .sort({ role: 1, createdAt: 1 });

    if (!organizer) {
      throw new Error('No admin, counselor, or peer supporter account found to own seeded wellness events.');
    }

    await Activity.deleteMany({});

    const activities = wellnessEvents.map((event) => ({
      ...event,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      organizer: organizer._id,
      registeredStudents: []
    }));

    const created = await Activity.insertMany(activities, { ordered: true });

    console.log(`Seeded ${created.length} production-ready wellness events.`);
    console.log(`Organizer: ${organizer.email}`);
    created.forEach((activity) => {
      console.log(`- ${activity.title} (${activity.category})`);
    });
  } catch (error) {
    console.error('Failed to seed wellness events:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

if (require.main === module) {
  seedActivities();
}

module.exports = seedActivities;
