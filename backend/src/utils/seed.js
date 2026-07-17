require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Employee = require('../models/Employee');

async function seed() {
  await connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/ems');

  const email = process.env.SEED_SUPERADMIN_EMAIL || 'admin@ems.com';
  const password = process.env.SEED_SUPERADMIN_PASSWORD || 'Admin@123';

  const existing = await Employee.findOne({ email });
  if (existing) {
    console.log(`Super Admin already exists: ${email}`);
  } else {
    await Employee.create({
      employeeId: 'EMP-0001',
      name: 'System Super Admin',
      email,
      phone: '+1-000-000-0000',
      password,
      department: 'Administration',
      designation: 'Super Administrator',
      salary: 0,
      joiningDate: new Date(),
      status: 'Active',
      role: 'Super Admin',
    });
    console.log(`Super Admin created -> email: ${email} | password: ${password}`);
  }

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
