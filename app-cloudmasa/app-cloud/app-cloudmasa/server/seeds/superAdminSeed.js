// server/seeds/superAdminSeed.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Register from '../models/RegisterModel.js';

// Make sure this matches your actual MongoDB URI
const MONGODB_URI = 'mongodb://admin:password123@13.218.210.100:27017/cloudmasa?authSource=admin';

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const hashedPassword = await bcrypt.hash('Sar0@123', 10);
    const superAdmin = new Register({
      name: "Saravana",
      email: "saravana.g@cloudmasa.com",
      password: hashedPassword,
      role: "super-admin"
    });
    await superAdmin.save();
    console.log('✅ Super Admin created successfully!');
  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
  } finally {
    // Close the connection after the operation
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
};

createSuperAdmin();