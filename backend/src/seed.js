/**
 * ============================================================================
 *                    HOSTGUARD SEED SCRIPT - VIVA CHEAT SHEET & INDEX
 * ============================================================================
 * Run command: "npm run seed" (or "node src/seed.js" inside backend/)
 * Default password for all demo accounts: "Password@123"
 *
 * Use "Ctrl + F" in this file to jump directly to any seed data:
 *
 *  EXAMINER QUESTION / TOPIC            | EXACT SEARCH KEYWORD (Ctrl + F)
 * --------------------------------------+-------------------------------------
 *  1. "How do you reset the database?"  | SECTION 2: DB RESET
 *     - Drop database command           | dropDatabase
 *
 *  2. "Where are hostels initialized?"  | SECTION 3: HOSTELS
 *     - Boys Hostel 1 & 2, Girls Hostel | BH1
 *
 *  3. "Where is the demo Student host?" | SECTION 4: STUDENT
 *     - Student Roll Number & Room      | 24UCS049
 *
 *  4. "Where is the Gate Guard user?"   | SECTION 5: GUARD
 *     - Guard ID & Gate Assignment      | G012
 *
 *  5. "Where is the Warden seeded?"     | SECTION 6: WARDEN
 *     - Warden ID & Hostel Assignment   | W001
 *
 *  6. "Where is the Admin account?"     | SECTION 7: ADMIN
 *     - Chief Security Officer Email    | admin@lnmiit.ac.in
 *
 *  7. "Where are Mess/Cleaning staff?"  | SECTION 8: WORKERS
 *     - Worker IDs & status             | WRK-001
 *
 *  8. "What are the demo passwords?"    | DEMO CREDENTIALS SUMMARY
 *     - Bcrypt 10-round hash            | Password@123
 * ============================================================================
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hostguard';

// -------------------------------------------------------------
// SECTION 1: SCHEMAS & MODELS (Lightweight definitions for seeding)
// -------------------------------------------------------------
const User = mongoose.model('User', new mongoose.Schema({
  userId: String,
  name: String,
  email: String,
  password: { type: String, select: true },
  role: String,
  accountStatus: { type: String, default: 'ACTIVE' },
  status: { type: String, default: 'ACTIVE' },
  profile: Object
}));

const StudentProfile = mongoose.model('StudentProfile', new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  rollNumber: String,
  hostelId: String,
  roomNumber: String
}));

const GuardProfile = mongoose.model('GuardProfile', new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  guardId: String,
  gateId: String,
  assignedHostelId: String
}));

const WardenProfile = mongoose.model('WardenProfile', new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  wardenId: String,
  assignedHostelId: String
}));

const Hostel = mongoose.model('Hostel', new mongoose.Schema({
  hostelId: String,
  name: String,
  capacity: Number,
  currentOccupancy: Number
}));

const Worker = mongoose.model('Worker', new mongoose.Schema({
  workerId: String,
  name: String,
  category: String,
  hostelId: String,
  currentlyInside: Boolean
}));

async function seed() {
  console.log('[HostGuard Seed] Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);

  // -----------------------------------------------------------
  // SECTION 2: DB RESET
  // -----------------------------------------------------------
  console.log('[HostGuard Seed] Dropping old database collections & indexes...');
  try {
    await mongoose.connection.db.dropDatabase();
  } catch (e) {}

  // -----------------------------------------------------------
  // SECTION 3: HOSTELS
  // -----------------------------------------------------------
  console.log('[HostGuard Seed] Seeding Hostels...');
  await Hostel.create([
    { hostelId: 'BH1', name: 'Boys Hostel 1', capacity: 450, currentOccupancy: 380 },
    { hostelId: 'BH2', name: 'Boys Hostel 2', capacity: 450, currentOccupancy: 390 },
    { hostelId: 'BH3', name: 'Boys Hostel 3', capacity: 450, currentOccupancy: 350 },
    { hostelId: 'GH',  name: 'Girls Hostel',  capacity: 350, currentOccupancy: 310 }
  ]);

  console.log('[HostGuard Seed] Seeding Users (Password: Password@123)...');
  const hashedPassword = await bcrypt.hash('Password@123', 10);

  // -----------------------------------------------------------
  // SECTION 4: STUDENT
  // -----------------------------------------------------------
  const student = await User.create({
    userId: '24UCS049',
    name: 'Malapati Charith',
    email: '24ucs049@lnmiit.ac.in',
    password: hashedPassword,
    role: 'STUDENT',
    accountStatus: 'ACTIVE',
    profile: { fullName: 'Malapati Charith', rollNumber: '24UCS049', hostelId: 'BH1', roomNumber: 'B-204' }
  });
  await StudentProfile.create({
    userId: student._id,
    rollNumber: '24UCS049',
    hostelId: 'BH1',
    roomNumber: 'B-204'
  });

  // -----------------------------------------------------------
  // SECTION 5: GUARD
  // -----------------------------------------------------------
  const guard = await User.create({
    userId: 'G012',
    name: 'Ramesh Singh',
    email: 'guard1@lnmiit.ac.in',
    password: hashedPassword,
    role: 'GUARD',
    accountStatus: 'ACTIVE',
    profile: { fullName: 'Ramesh Singh', guardId: 'G012', gateId: 'GATE_BH1', hostelId: 'BH1' }
  });
  await GuardProfile.create({
    userId: guard._id,
    guardId: 'G012',
    gateId: 'GATE_BH1',
    assignedHostelId: 'BH1'
  });

  // -----------------------------------------------------------
  // SECTION 6: WARDEN
  // -----------------------------------------------------------
  const warden = await User.create({
    userId: 'W001',
    name: 'Dr. Sunil Kumar',
    email: 'warden.bh1@lnmiit.ac.in',
    password: hashedPassword,
    role: 'WARDEN',
    accountStatus: 'ACTIVE',
    profile: { fullName: 'Dr. Sunil Kumar', hostelId: 'BH1' }
  });
  await WardenProfile.create({
    userId: warden._id,
    wardenId: 'W001',
    assignedHostelId: 'BH1'
  });

  // -----------------------------------------------------------
  // SECTION 7: ADMIN
  // -----------------------------------------------------------
  await User.create({
    userId: 'ADM001',
    name: 'Chief Security Officer',
    email: 'admin@lnmiit.ac.in',
    password: hashedPassword,
    role: 'ADMIN',
    accountStatus: 'ACTIVE',
    profile: { fullName: 'Chief Security Officer' }
  });

  // -----------------------------------------------------------
  // SECTION 8: WORKERS
  // -----------------------------------------------------------
  await Worker.create([
    { workerId: 'WRK-001', name: 'Kallu Ram', category: 'MESS', hostelId: 'BH1', currentlyInside: false },
    { workerId: 'WRK-002', name: 'Shyam Lal', category: 'CLEANING', hostelId: 'BH1', currentlyInside: false }
  ]);

  // -----------------------------------------------------------
  // DEMO CREDENTIALS SUMMARY
  // -----------------------------------------------------------
  console.log('-----------------------------------------------------------');
  console.log('[HostGuard Seed] Database successfully seeded!');
  console.log('Admin:       admin@lnmiit.ac.in');
  console.log('Warden BH1:  warden.bh1@lnmiit.ac.in');
  console.log('Guard BH1:   guard1@lnmiit.ac.in (or Guard ID: G012)');
  console.log('Student:     24ucs049@lnmiit.ac.in (Roll: 24UCS049 - Malapati Charith)');
  console.log('Password:    Password@123');
  console.log('-----------------------------------------------------------');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('[HostGuard Seed Error]:', err);
  process.exit(1);
});
