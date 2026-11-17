/**
 * ============================================================================
 *             HOSTGUARD - INSTANT ENTITY CREATOR (VIVA QUICK-ACTION)
 * ============================================================================
 * When your teacher asks: "Add a visit request / user / hostel from the code!"
 *
 * HOW TO USE:
 * 1. Open this file.
 * 2. UNCOMMENT the block you want to run (change name/values if teacher asks).
 * 3. Run in terminal:  node src/createSamples.js
 *
 * Ctrl + F KEYWORDS:
 *  - "BLOCK 1: VISIT REQUEST"       -> Add a basic visitor request
 *  - "BLOCK 2: APPROVED + QR PASS"  -> Add an approved visitor with live QR code
 *  - "BLOCK 3: CHECKED-IN VISITOR"  -> Add a visitor currently inside the hostel
 *  - "BLOCK 4: STUDENT USER"        -> Add a new host student
 *  - "BLOCK 5: GUARD USER"          -> Add a new security guard
 *  - "BLOCK 6: WARDEN USER"         -> Add a new hostel warden
 *  - "BLOCK 7: HOSTEL"              -> Add a new campus hostel building
 *  - "BLOCK 8: WORKER"              -> Add a mess/cleaning staff worker
 *  - "BLOCK 9: FEEDBACK"            -> Add a sample feedback record
 * ============================================================================
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import {
  User,
  StudentProfile,
  GuardProfile,
  WardenProfile,
  VisitRequest,
  QRPass,
  VisitRecord,
  Hostel,
  Worker,
  SampleFeedback
} from './server.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hostguard';

async function run() {
  console.log('[HostGuard Creator] Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);

  // ==========================================================================
  // BLOCK 1: CREATE A NEW VISIT REQUEST (PENDING CLEARANCE)
  // Teacher: "Add a visitor request from code for student 24UCS049"
  // ==========================================================================
  /*
  // const reqId = `VR${Math.floor(1000 + Math.random() * 9000)}`;
  // const newRequest = await VisitRequest.create({
  //   requestId: reqId,
  //   visitor: {
  //     fullName: 'Vikram Malhotra',
  //     phoneNumber: '9876543210',
  //     identificationType: 'Aadhaar Card',
  //     identificationNumber: 'XXXX-XXXX-8899'
  //   },
  //   hostStudentRollNumber: '24UCS049',
  //   hostelId: 'BH1',
  //   roomNumber: 'B-204',
  //   purpose: 'Academic Project Discussion',
  //   visitDate: new Date().toISOString().split('T')[0],
  //   expectedEntryTime: new Date(),
  //   expectedExitTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
  //   vehicleNumber: 'RJ-14-AB-1234',
  //   accompanyingGuests: [{ name: 'Sanjay Malhotra' }],
  //   requestStatus: 'PENDING',
  //   accessToken: `ACC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  // });
  // console.log(`[SUCCESS] Created PENDING Visit Request: ${newRequest.requestId} for ${newRequest.visitor.fullName}`);
  */

  // ==========================================================================
  // BLOCK 2: CREATE APPROVED REQUEST + QR CODE PASS (READY FOR SCANNING)
  // Teacher: "Create an approved request with a live QR pass directly"
  // ==========================================================================
  /*
  const approvedReqId = `VR${Math.floor(1000 + Math.random() * 9000)}`;
  const approvedRequest = await VisitRequest.create({
    requestId: approvedReqId,
    visitor: {
      fullName: 'Anita Sharma',
      phoneNumber: '9123456780',
      identificationType: 'Passport',
      identificationNumber: 'Z8942101'
    },
    hostStudentRollNumber: '24UCS049',
    hostelId: 'BH1',
    roomNumber: 'B-204',
    purpose: 'Family Visit',
    visitDate: new Date().toISOString().split('T')[0],
    expectedEntryTime: new Date(),
    expectedExitTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
    requestStatus: 'APPROVED',
    accessToken: `ACC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  });

  const qrToken = `TKN-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrToken);

  const qrPass = await QRPass.create({
    passId: `PASS-${Math.floor(1000 + Math.random() * 9000)}`,
    requestId: approvedRequest.requestId,
    token: qrToken,
    qrCodeDataUrl,
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });
  console.log(`[SUCCESS] Created APPROVED Request: ${approvedRequest.requestId} with QR Token: ${qrPass.token}`);
  */

  // ==========================================================================
  // BLOCK 3: CREATE CHECKED-IN VISITOR (CURRENTLY INSIDE HOSTEL)
  // Teacher: "Add a visitor who is already inside the hostel"
  // ==========================================================================
  /*
  const insideReqId = `VR${Math.floor(1000 + Math.random() * 9000)}`;
  const insideRequest = await VisitRequest.create({
    requestId: insideReqId,
    visitor: {
      fullName: 'Rohan Verma',
      phoneNumber: '9829011122',
      identificationType: 'Driving License',
      identificationNumber: 'RJ-14-2023-0091'
    },
    hostStudentRollNumber: '24UCS049',
    hostelId: 'BH1',
    roomNumber: 'B-204',
    purpose: 'Study Group Discussion',
    visitDate: new Date().toISOString().split('T')[0],
    expectedEntryTime: new Date(Date.now() - 30 * 60 * 1000), // entered 30 mins ago
    expectedExitTime: new Date(Date.now() + 90 * 60 * 1000),
    requestStatus: 'CHECKED_IN'
  });

  await VisitRecord.create({
    recordId: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
    requestId: insideRequest.requestId,
    visitorName: insideRequest.visitor.fullName,
    hostStudentRollNumber: insideRequest.hostStudentRollNumber,
    hostelId: insideRequest.hostelId,
    roomNumber: insideRequest.roomNumber,
    actualEntryTime: new Date(Date.now() - 30 * 60 * 1000),
    actualExitTime: null,
    gateId: 'GATE_BH1'
  });
  console.log(`[SUCCESS] Created CHECKED-IN Visitor: ${insideRequest.visitor.fullName} (Inside BH1)`);
  */

  // ==========================================================================
  // BLOCK 4: CREATE A NEW STUDENT USER
  // Teacher: "Add another student to the database"
  // ==========================================================================
  /*
  const hashedPassword = await bcrypt.hash('Password@123', 10);
  const newStudent = await User.create({
    userId: '24UCS099',
    name: 'Aarav Mehta',
    email: '24ucs099@lnmiit.ac.in',
    password: hashedPassword,
    role: 'STUDENT',
    accountStatus: 'ACTIVE',
    profile: {
      fullName: 'Aarav Mehta',
      rollNumber: '24UCS099',
      hostelId: 'BH2',
      roomNumber: 'A-101'
    }
  });

  await StudentProfile.create({
    userId: newStudent._id,
    rollNumber: '24UCS099',
    hostelId: 'BH2',
    roomNumber: 'A-101'
  });
  console.log(`[SUCCESS] Created Student: ${newStudent.profile.fullName} (Roll: 24UCS099, BH2 A-101)`);
  */

  // ==========================================================================
  // BLOCK 5: CREATE A NEW GUARD USER
  // Teacher: "Add another security guard"
  // ==========================================================================
  /*
  const guardPassword = await bcrypt.hash('Password@123', 10);
  const newGuard = await User.create({
    userId: 'G099',
    name: 'Balwant Singh',
    email: 'guard.bh2@lnmiit.ac.in',
    password: guardPassword,
    role: 'GUARD',
    accountStatus: 'ACTIVE',
    profile: {
      fullName: 'Balwant Singh',
      guardId: 'G099',
      gateId: 'GATE_BH2',
      hostelId: 'BH2'
    }
  });

  await GuardProfile.create({
    userId: newGuard._id,
    guardId: 'G099',
    gateId: 'GATE_BH2',
    assignedHostelId: 'BH2'
  });
  console.log(`[SUCCESS] Created Guard: Balwant Singh (ID: G099 at Gate BH2)`);
  */

  // ==========================================================================
  // BLOCK 6: CREATE A NEW WARDEN USER
  // Teacher: "Add a warden for BH2 or Girls Hostel"
  // ==========================================================================
  /*
  const wardenPassword = await bcrypt.hash('Password@123', 10);
  const newWarden = await User.create({
    userId: 'W002',
    name: 'Dr. Alok Ranjan',
    email: 'warden.bh2@lnmiit.ac.in',
    password: wardenPassword,
    role: 'WARDEN',
    accountStatus: 'ACTIVE',
    profile: {
      fullName: 'Dr. Alok Ranjan',
      hostelId: 'BH2'
    }
  });

  await WardenProfile.create({
    userId: newWarden._id,
    wardenId: 'W002',
    assignedHostelId: 'BH2'
  });
  console.log(`[SUCCESS] Created Warden: Dr. Alok Ranjan (Assigned: BH2)`);
  */

  // ==========================================================================
  // BLOCK 7: CREATE A NEW HOSTEL
  // Teacher: "Add a new hostel building"
  // ==========================================================================
  /*
  const newHostel = await Hostel.create({
    hostelId: 'BH4',
    name: 'Boys Hostel 4',
    capacity: 450,
    currentOccupancy: 200
  });
  console.log(`[SUCCESS] Created Hostel: ${newHostel.name} (${newHostel.hostelId})`);
  */

  // ==========================================================================
  // BLOCK 8: CREATE A WORKER / STAFF MEMBER
  // Teacher: "Add a mess worker or electrician to the system"
  // ==========================================================================
  /*
  const newWorker = await Worker.create({
    workerId: `WRK-${Math.floor(1000 + Math.random() * 9000)}`,
    name: 'Manoj Kumar',
    category: 'ELECTRICIAN',
    hostelId: 'BH1',
    status: 'ACTIVE',
    currentlyInside: false
  });
  console.log(`[SUCCESS] Created Worker: ${newWorker.name} (${newWorker.category} at ${newWorker.hostelId})`);
  */

  // ==========================================================================
  // BLOCK 9: CREATE SAMPLE FEEDBACK / INCIDENT
  // Teacher: "Show creating a feedback or incident document"
  // ==========================================================================
  /*
  const feedback = await SampleFeedback.create({
    title: 'Fast Entry Verification',
    message: 'Guard verified Aadhaar ID and QR pass smoothly at Main Gate.',
    submittedBy: 'Malapati Charith (24UCS049)',
    rating: 5,
    status: 'RESOLVED'
  });
  console.log(`[SUCCESS] Created Feedback entry: "${feedback.title}" (Rating: ${feedback.rating}/5)`);
  */

  console.log('-----------------------------------------------------------');
  console.log('[HostGuard Creator] Finished! (Make sure to uncomment the block you want to run)');
  console.log('-----------------------------------------------------------');

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('[HostGuard Creator Error]:', err);
  process.exit(1);
});
