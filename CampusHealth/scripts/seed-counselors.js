const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const dns = require('dns');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const Counselor = require('../models/Counselor');
const User = require('../models/User');
const sampleCounselors = require('../data/sample-counselors');

const SAMPLE_PASSWORD = 'CampusDemo!2026';

async function seedCounselors() {
  const dnsServers = (process.env.MONGODB_DNS_SERVERS || '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);
  if (process.env.MONGODB_URI?.startsWith('mongodb+srv://') && dnsServers.length) {
    dns.setServers(dnsServers);
  }
  await mongoose.connect(process.env.MONGODB_URI);

  const sampleEmails = sampleCounselors.map(({ email }) => email);
  await Counselor.deleteMany({});
  await User.deleteMany({
    role: 'counselor',
    email: { $nin: sampleEmails }
  });

  for (const profile of sampleCounselors) {
    const [firstName, ...lastNameParts] = profile.name.replace(/^(Dr|Ms)\.\s+/, '').split(' ');
    const password = await bcrypt.hash(SAMPLE_PASSWORD, 12);
    const user = await User.findOneAndUpdate(
      { email: profile.email },
      {
        $set: {
          name: profile.name,
          firstName,
          lastName: lastNameParts.join(' '),
          phone: profile.phone,
          department: 'Counseling Services',
          year: 'Post Graduate',
          yearOfStudy: 'Post Graduate',
          role: 'counselor',
          isActive: true,
          authProvider: 'local',
          password
        }
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    await Counselor.create({
      ...profile,
      userId: user._id,
      profileImage: ''
    });
  }

  const count = await Counselor.countDocuments();
  console.log(`Seeded ${count} public sample counselor profiles.`);
}

seedCounselors()
  .catch((error) => {
    console.error('Counselor seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
