import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Hostel } from '../models/Hostel.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { GuardProfile } from '../models/GuardProfile.js';
import { WardenProfile } from '../models/WardenProfile.js';
import { Worker } from '../models/Worker.js';
import { VisitRequest } from '../models/VisitRequest.js';
import { QRPass } from '../models/QRPass.js';
import { VisitRecord } from '../models/VisitRecord.js';
import { GuardAttendance } from '../models/GuardAttendance.js';
import { Notification } from '../models/Notification.js';
import { OverstayAlert } from '../models/OverstayAlert.js';
import { AuditLog } from '../models/AuditLog.js';
import { ROLES, USER_STATUS, REQUEST_STATUS, PASS_STATUS, WORKER_TYPES, HOSTEL_LIST } from '../config/constants.js';
import { getISTParts, parseISTDateTime, getNow } from '../utils/timeUtils.js';
import { generateSecureToken } from '../utils/tokenUtils.js';
import { generateQRCodeDataUrl } from '../utils/qrUtils.js';

export const seedDatabase = async () => {
  console.log('[HostGuard Seed] Connecting to database...');
  await connectDB();

  console.log('[HostGuard Seed] Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Hostel.deleteMany({}),
    StudentProfile.deleteMany({}),
    GuardProfile.deleteMany({}),
    WardenProfile.deleteMany({}),
    Worker.deleteMany({}),
    VisitRequest.deleteMany({}),
    QRPass.deleteMany({}),
    VisitRecord.deleteMany({}),
    GuardAttendance.deleteMany({}),
    Notification.deleteMany({}),
    OverstayAlert.deleteMany({}),
    AuditLog.deleteMany({})
  ]);

  console.log('[HostGuard Seed] Seeding Hostels...');
  const hostels = await Hostel.insertMany([
    { hostelId: 'BH1', hostelName: 'Boys Hostel 1', type: 'BOYS', wardenId: 'W001' },
    { hostelId: 'BH2', hostelName: 'Boys Hostel 2', type: 'BOYS', wardenId: 'W001' },
    { hostelId: 'BH3', hostelName: 'Boys Hostel 3', type: 'BOYS', wardenId: 'W002' },
    { hostelId: 'BH4', hostelName: 'Boys Hostel 4', type: 'BOYS', wardenId: 'W002' },
    { hostelId: 'BH5', hostelName: 'Boys Hostel 5', type: 'BOYS', wardenId: 'W003' },
    { hostelId: 'GH',  hostelName: 'Girls Hostel',  type: 'GIRLS', wardenId: 'W004' }
  ]);

  console.log('[HostGuard Seed] Seeding Users & Profiles...');

  // 1. Admin
  const adminUser = await User.create({
    userId: 'ADM001',
    name: 'Chief Security Officer (Admin)',
    email: 'admin@lnmiit.ac.in',
    phoneNumber: '+91 98290 11223',
    password: 'Password@123',
    role: ROLES.ADMIN,
    accountStatus: USER_STATUS.ACTIVE
  });

  // 2. Wardens
  const wardenUser1 = await User.create({
    userId: 'W001',
    name: 'Dr. Sunil Kumar',
    email: 'warden.bh1@lnmiit.ac.in',
    phoneNumber: '+91 98290 44556',
    password: 'Password@123',
    role: ROLES.WARDEN,
    accountStatus: USER_STATUS.ACTIVE
  });
  await WardenProfile.create({
    userId: wardenUser1._id,
    wardenId: 'W001',
    assignedHostelId: 'BH1',
    officePhone: '0141-5191820'
  });

  const wardenUser2 = await User.create({
    userId: 'W004',
    name: 'Dr. Preeti Sharma',
    email: 'warden.gh@lnmiit.ac.in',
    phoneNumber: '+91 98290 55667',
    password: 'Password@123',
    role: ROLES.WARDEN,
    accountStatus: USER_STATUS.ACTIVE
  });
  await WardenProfile.create({
    userId: wardenUser2._id,
    wardenId: 'W004',
    assignedHostelId: 'GH',
    officePhone: '0141-5191821'
  });

  // 3. Guards
  const guardUser1 = await User.create({
    userId: 'G012',
    name: 'Ramesh Singh (Gate 1)',
    email: 'guard1@lnmiit.ac.in',
    phoneNumber: '+91 94140 12345',
    password: 'Password@123',
    role: ROLES.GUARD,
    accountStatus: USER_STATUS.ACTIVE
  });
  await GuardProfile.create({
    userId: guardUser1._id,
    guardId: 'G012',
    assignedHostelId: 'BH1',
    badgeNumber: 'BDG-BH1-01',
    isOnDuty: true
  });

  const guardUser2 = await User.create({
    userId: 'G015',
    name: 'Mohan Lal (GH Gate)',
    email: 'guard2@lnmiit.ac.in',
    phoneNumber: '+91 94140 67890',
    password: 'Password@123',
    role: ROLES.GUARD,
    accountStatus: USER_STATUS.ACTIVE
  });
  await GuardProfile.create({
    userId: guardUser2._id,
    guardId: 'G015',
    assignedHostelId: 'GH',
    badgeNumber: 'BDG-GH-01',
    isOnDuty: false
  });

  // 4. Students (Team T049 Members)
  const studentsData = [
    {
      userId: 'STU049',
      name: 'Malapati Charith',
      email: '24ucs049@lnmiit.ac.in',
      rollNumber: '24UCS049',
      phoneNumber: '+91 98765 43210',
      hostelId: 'BH1',
      roomNumber: 'B-201'
    },
    {
      userId: 'STU050',
      name: 'Atharva Sharma',
      email: '24ucs050@lnmiit.ac.in',
      rollNumber: '24UCS050',
      phoneNumber: '+91 98765 43211',
      hostelId: 'BH1',
      roomNumber: 'B-202'
    },
    {
      userId: 'STU051',
      name: 'Raghav Gupta',
      email: '24ucs051@lnmiit.ac.in',
      rollNumber: '24UCS051',
      phoneNumber: '+91 98765 43212',
      hostelId: 'BH2',
      roomNumber: 'A-105'
    },
    {
      userId: 'STU052',
      name: 'Rudraksh Tank',
      email: '24ucs052@lnmiit.ac.in',
      rollNumber: '24UCS052',
      phoneNumber: '+91 98765 43213',
      hostelId: 'BH3',
      roomNumber: 'C-304'
    }
  ];

  for (const s of studentsData) {
    const u = await User.create({
      userId: s.userId,
      name: s.name,
      email: s.email,
      phoneNumber: s.phoneNumber,
      password: 'Password@123',
      role: ROLES.STUDENT,
      accountStatus: USER_STATUS.ACTIVE
    });
    await StudentProfile.create({
      userId: u._id,
      studentId: s.userId,
      rollNumber: s.rollNumber,
      hostelId: s.hostelId,
      roomNumber: s.roomNumber
    });
  }

  // Suspended student for testing BR-002
  const blockedUser = await User.create({
    userId: 'STU999',
    name: 'Suspended Student',
    email: 'suspended@lnmiit.ac.in',
    phoneNumber: '+91 98765 99999',
    password: 'Password@123',
    role: ROLES.STUDENT,
    accountStatus: USER_STATUS.BLOCKED
  });
  await StudentProfile.create({
    userId: blockedUser._id,
    studentId: 'STU999',
    rollNumber: '24UCS999',
    hostelId: 'BH1',
    roomNumber: 'B-404'
  });

  // 5. Workers (FR-047, FR-048)
  await Worker.insertMany([
    {
      workerId: 'WRK101',
      name: 'Suresh Kumar',
      phoneNumber: '+91 91234 56789',
      workerType: WORKER_TYPES.PERMANENT,
      department: 'Electrical Maintenance',
      assignedHostelId: 'BH1',
      qrToken: 'WQR-BH1-ELEC-101',
      currentlyInside: false
    },
    {
      workerId: 'WRK102',
      name: 'Rajesh Verma',
      phoneNumber: '+91 91234 56780',
      workerType: WORKER_TYPES.CONTRACT,
      department: 'Housekeeping',
      assignedHostelId: 'BH1',
      qrToken: 'WQR-BH1-HK-102',
      currentlyInside: true,
      lastEntryTime: new Date(Date.now() - 3 * 3600 * 1000)
    },
    {
      workerId: 'WRK103',
      name: 'Kallu Ram',
      phoneNumber: '+91 91234 56781',
      workerType: WORKER_TYPES.DAILY,
      department: 'Mess Services',
      assignedHostelId: 'BH2',
      qrToken: 'WQR-BH2-MESS-103',
      currentlyInside: false
    }
  ]);

  // 6. Active Guard Shift for G012 today (BR-011)
  const todayIST = getISTParts().dateStr;
  await GuardAttendance.create({
    attendanceId: 'ATT-TODAY-001',
    guardId: 'G012',
    guardName: 'Ramesh Singh',
    hostelId: 'BH1',
    date: todayIST,
    checkInTime: new Date(Date.now() - 4 * 3600 * 1000), // checked in 4h ago
    shiftHours: 'General Day (06:00 - 19:00)',
    isActive: true
  });

  // 7. Sample Visit Requests & Passes
  // A. Pending Request for 24UCS049 (Malapati Charith)
  await VisitRequest.create({
    requestId: 'VR2001',
    visitor: {
      fullName: 'Vikramaditya Rathore',
      phoneNumber: '+91 98291 11222',
      identificationType: 'Aadhaar Card',
      identificationNumber: '9876-5432-1098'
    },
    hostStudentRollNumber: '24UCS049',
    hostelId: 'BH1',
    roomNumber: 'B-201',
    purpose: 'Academic project discussion',
    visitDate: todayIST,
    expectedEntryTime: parseISTDateTime(todayIST, '17:00'),
    expectedExitTime: parseISTDateTime(todayIST, '18:30'),
    totalVisitorCount: 2,
    accompanyingGuests: [
      { name: 'Kunal Sharma', identificationType: 'College ID', identificationNumber: 'JECRC-552' }
    ],
    requestStatus: REQUEST_STATUS.PENDING,
    accessToken: 'PASSKEY-VR2001-PENDING'
  });

  // B. Approved Request ready for scanning at gate
  const approvedReq = await VisitRequest.create({
    requestId: 'VR2045',
    visitor: {
      fullName: 'Ananya Deshmukh (Parent)',
      phoneNumber: '+91 98292 33445',
      identificationType: 'Government ID',
      identificationNumber: 'ID4521'
    },
    hostStudentRollNumber: '24UCS049',
    hostelId: 'BH1',
    roomNumber: 'B-201',
    purpose: 'Family visit & luggage drop-off',
    visitDate: todayIST,
    expectedEntryTime: parseISTDateTime(todayIST, '16:00'),
    expectedExitTime: parseISTDateTime(todayIST, '18:30'),
    totalVisitorCount: 1,
    requestStatus: REQUEST_STATUS.APPROVED,
    approvedAt: new Date(Date.now() - 30 * 60 * 1000),
    accessToken: 'PASSKEY-VR2045-APPROVED'
  });

  const qrPayloadApproved = JSON.stringify({
    passId: 'QR7788',
    token: 'TKN-A45X9',
    requestId: 'VR2045',
    hostelId: 'BH1',
    type: 'HOSTGUARD_PASS'
  });
  const qrDataUrl = await generateQRCodeDataUrl(qrPayloadApproved);

  await QRPass.create({
    passId: 'QR7788',
    requestId: 'VR2045',
    token: 'TKN-A45X9',
    validUntil: approvedReq.expectedExitTime,
    status: PASS_STATUS.ACTIVE,
    qrCodeDataUrl: qrDataUrl
  });

  // C. Currently Checked-in Active Visitor inside BH1 (to demonstrate live gate state & occupancy)
  const activeInsideReq = await VisitRequest.create({
    requestId: 'VR2040',
    visitor: {
      fullName: 'Rohit Meena',
      phoneNumber: '+91 98293 44556',
      identificationType: 'Aadhaar Card',
      identificationNumber: '4455-6677-8899'
    },
    hostStudentRollNumber: '24UCS050',
    hostelId: 'BH1',
    roomNumber: 'B-202',
    purpose: 'Book return & notes collection',
    visitDate: todayIST,
    expectedEntryTime: parseISTDateTime(todayIST, '15:00'),
    expectedExitTime: new Date(Date.now() + 60 * 60 * 1000), // Exits in 1 hour
    totalVisitorCount: 1,
    requestStatus: REQUEST_STATUS.APPROVED,
    approvedAt: new Date(Date.now() - 2 * 3600 * 1000),
    accessToken: 'PASSKEY-VR2040-ACTIVE'
  });

  await QRPass.create({
    passId: 'QR7740',
    requestId: 'VR2040',
    token: 'TKN-ACT40',
    validUntil: activeInsideReq.expectedExitTime,
    status: PASS_STATUS.IN_USE
  });

  await VisitRecord.create({
    visitId: 'VREC2040',
    requestId: 'VR2040',
    passId: 'QR7740',
    hostStudentRollNumber: '24UCS050',
    hostelId: 'BH1',
    visitorName: 'Rohit Meena',
    visitorPhone: '+91 98293 44556',
    totalVisitorCount: 1,
    entryTime: new Date(Date.now() - 45 * 60 * 1000),
    expectedExitTime: activeInsideReq.expectedExitTime,
    guardId: 'G012'
  });

  // D. Overstaying Visitor inside BH1 (to demonstrate visual red alert & Warden overstay feed)
  const overstayReq = await VisitRequest.create({
    requestId: 'VR2030',
    visitor: {
      fullName: 'Prakash Chandra',
      phoneNumber: '+91 98294 55667',
      identificationType: 'Driving License',
      identificationNumber: 'RJ-14-2020-009988'
    },
    hostStudentRollNumber: '24UCS049',
    hostelId: 'BH1',
    roomNumber: 'B-201',
    purpose: 'Laptop repair assistance',
    visitDate: todayIST,
    expectedEntryTime: parseISTDateTime(todayIST, '14:00'),
    expectedExitTime: new Date(Date.now() - 30 * 60 * 1000), // Expected to exit 30 mins ago!
    totalVisitorCount: 1,
    requestStatus: REQUEST_STATUS.APPROVED,
    approvedAt: new Date(Date.now() - 4 * 3600 * 1000),
    accessToken: 'PASSKEY-VR2030-OVERSTAY'
  });

  await QRPass.create({
    passId: 'QR7730',
    requestId: 'VR2030',
    token: 'TKN-OVR30',
    validUntil: overstayReq.expectedExitTime,
    status: PASS_STATUS.IN_USE
  });

  await VisitRecord.create({
    visitId: 'VREC2030',
    requestId: 'VR2030',
    passId: 'QR7730',
    hostStudentRollNumber: '24UCS049',
    hostelId: 'BH1',
    visitorName: 'Prakash Chandra',
    visitorPhone: '+91 98294 55667',
    totalVisitorCount: 1,
    entryTime: new Date(Date.now() - 2 * 3600 * 1000),
    expectedExitTime: overstayReq.expectedExitTime,
    overstayStatus: true,
    guardId: 'G012'
  });

  await OverstayAlert.create({
    alertId: 'OVALT-1001',
    visitId: 'VREC2030',
    requestId: 'VR2030',
    hostelId: 'BH1',
    studentRollNumber: '24UCS049',
    visitorName: 'Prakash Chandra',
    expectedExitTime: overstayReq.expectedExitTime,
    detectedAt: new Date(Date.now() - 25 * 60 * 1000),
    status: 'OPEN'
  });

  // Update hostel active count
  await Hostel.findOneAndUpdate({ hostelId: 'BH1' }, { activeVisitorsCount: 2, currentOccupancy: 340 });
  await StudentProfile.findOneAndUpdate({ rollNumber: '24UCS049' }, { activeVisitorsCount: 1 });
  await StudentProfile.findOneAndUpdate({ rollNumber: '24UCS050' }, { activeVisitorsCount: 1 });

  // 8. Sample System Notification
  await Notification.create({
    notificationId: 'NOTIF-001',
    recipientUserId: '24UCS049',
    recipientRole: 'STUDENT',
    title: 'New Visitor Request Pending Approval',
    message: 'Visitor Vikramaditya Rathore (2 persons) requested entry to BH1 Room B-201. Please review within 20 minutes.',
    type: 'REQUEST_CREATED',
    metadata: { requestId: 'VR2001' }
  });

  console.log('[HostGuard Seed] Database successfully seeded!');
  console.log('-----------------------------------------------------------');
  console.log('Demo Credentials (Password: Password@123):');
  console.log('Admin:       admin@lnmiit.ac.in');
  console.log('Warden BH1:  warden.bh1@lnmiit.ac.in');
  console.log('Warden GH:   warden.gh@lnmiit.ac.in');
  console.log('Guard BH1:   guard1@lnmiit.ac.in (or Guard ID: G012)');
  console.log('Guard GH:    guard2@lnmiit.ac.in (or Guard ID: G015)');
  console.log('Student:     24ucs049@lnmiit.ac.in (Roll: 24UCS049 - Malapati Charith)');
  console.log('Student:     24ucs050@lnmiit.ac.in (Roll: 24UCS050 - Atharva Sharma)');
  console.log('Sample QR:   Token: TKN-A45X9 (Request ID: VR2045)');
  console.log('-----------------------------------------------------------');
};

// If run directly via `npm run seed`
if (process.argv[1].endsWith('seedData.js')) {
  seedDatabase()
    .then(() => disconnectDB())
    .catch((err) => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}
