const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-health');
    console.log('Connected to DB');

    const adminExists = await User.findOne({ email: 'admin@campushealth.com' });
    if (adminExists) {
      console.log('Admin already exists!');
      process.exit(0);
    }

    const admin = new User({
      studentId: 'ADMIN001',
      email: 'admin@campushealth.com',
      password: 'admin_password123',
      firstName: 'System',
      lastName: 'Admin',
      department: 'Administration',
      role: 'admin',
      isActive: true,
      preferredLanguage: 'en',
    });

    await admin.save();
    console.log('Admin user created successfully:');
    console.log('Email: admin@campushealth.com');
    console.log('Password: admin_password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Failed to create admin:', error);
    process.exit(1);
  }
};

createAdmin();
