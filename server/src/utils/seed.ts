import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';

dotenv.config();

const seedUsers = [
  { name: 'Admin User',         email: 'admin@lms.com',        password: 'admin123',        role: 'admin' },
  { name: 'Sales Executive',    email: 'sales@lms.com',        password: 'sales123',        role: 'sales' },
  { name: 'Sanction Officer',   email: 'sanction@lms.com',     password: 'sanction123',     role: 'sanction' },
  { name: 'Disbursement Agent', email: 'disburse@lms.com',     password: 'disburse123',     role: 'disbursement' },
  { name: 'Collection Agent',   email: 'collection@lms.com',   password: 'collection123',   role: 'collection' },
  { name: 'Test Borrower',      email: 'borrower@lms.com',     password: 'borrower123',     role: 'borrower' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to MongoDB');

    // Clear existing seed accounts (by known emails)
    const emails = seedUsers.map((u) => u.email);
    await User.deleteMany({ email: { $in: emails } });

    // Create fresh
    for (const userData of seedUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`  ✓ Created ${userData.role}: ${userData.email} / ${userData.password}`);
    }

    console.log('\n📋 Seed accounts ready:');
    console.log('─'.repeat(50));
    seedUsers.forEach((u) => {
      console.log(`  ${u.role.padEnd(14)} ${u.email.padEnd(25)} ${u.password}`);
    });
    console.log('─'.repeat(50));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
