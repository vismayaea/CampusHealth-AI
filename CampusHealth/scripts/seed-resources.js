const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const Resource = require('../models/Resource');
const publicResources = require('../data/public-resources');

// Load environment variables
dotenv.config();

const seedResources = async () => {
  try {
    const dnsServers = (process.env.MONGODB_DNS_SERVERS || '')
      .split(',')
      .map((server) => server.trim())
      .filter(Boolean);
    if (process.env.MONGODB_URI?.startsWith('mongodb+srv://') && dnsServers.length) {
      dns.setServers(dnsServers);
    }
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to DB for seeding resources...');

    await Resource.deleteMany({});
    const inserted = await Resource.insertMany(publicResources);
    console.log(`Seeding complete. Replaced the resource library with ${inserted.length} official public resources.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding resources:', error);
    process.exit(1);
  }
};

seedResources();
