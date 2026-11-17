/**
 * ============================================================================
 *                    HOSTGUARD BACKEND - VIVA CHEAT SHEET & INDEX
 * ============================================================================
 * Use "Ctrl + F" in this file to jump directly to any topic your examiner asks:
 *
 *  EXAMINER QUESTION / TOPIC            | EXACT SEARCH KEYWORD (Ctrl + F)
 * --------------------------------------+-------------------------------------
 *  1. "Show me your database schemas"   | SECTION 2: SCHEMAS
 *     - User Schema (roles, status)     | UserSchema
 *     - Visit Request Schema            | VisitRequestSchema
 *     - QR Code Pass Schema             | QRPassSchema
 *     - Gate Visit Record (Entry/Exit)  | VisitRecordSchema
 *     - Sample Schema (New Template)    | SAMPLE SCHEMA
 *
 *  2. "How does Authentication work?"   | SECTION 4: AUTH
 *     - Verify JWT Token Middleware     | const auth =
 *     - Login Route                     | app.post('/api/auth/login'
 *     - Password Hash Check             | bcrypt.compare
 *
 *  3. "Where is visitor request logic?" | SECTION 5: REQUESTS
 *     - Create Visit Request            | app.post('/api/requests'
 *     - 5-Visitor Quota Check (BR-001)  | currentActiveCount >= 5
 *     - Approve Request & Generate QR   | app.post('/api/requests/:id/approve'
 *     - QR Code DataURL Generation      | QRCode.toDataURL
 *     - Reject Request with Reason      | app.post('/api/requests/:id/reject'
 *     - Student Dashboard Feed          | app.get('/api/requests/student/feed'
 *
 *  4. "How does gate security work?"    | SECTION 6: GATE
 *     - Scan & Verify QR Code / Token   | app.get('/api/gate/verify'
 *     - Guard Check-In (Entry)          | app.post('/api/gate/checkin'
 *     - Guard Check-Out (Exit)          | app.post('/api/gate/checkout'
 *     - Active Visitors Inside Gate     | app.get('/api/gate/active-visitors'
 *
 *  5. "Where is Guard Attendance?"      | SECTION 7: ATTENDANCE
 *     - Shift Check-In / Check-Out      | app.post('/api/attendance/checkin'
 *
 *  6. "How does Warden Console work?"   | SECTION 8: WARDEN
 *     - Hostel Occupancy & Stats        | app.get('/api/warden/dashboard'
 *     - Overstay Disciplinary Alerts    | app.get('/api/warden/alerts'
 *     - Block / Unblock Student         | app.patch('/api/warden/students'
 *
 *  7. "Where is Worker Management?"     | SECTION 9: WORKERS
 *     - Staff In/Out Toggle             | app.post('/api/workers/gate-activity'
 *
 *  8. "Where is Admin Management?"      | SECTION 10: ADMIN
 *     - System Overview & Stats         | app.get('/api/admin/overview'
 *     - Change User Role / Status       | app.patch('/api/admin/users'
 *
 *  9. "Add a new schema/feature live"   | SECTION 12: SAMPLE CRUD
 *     - Create Document (POST)          | app.post('/api/feedback'
 *     - Read Documents (GET)            | app.get('/api/feedback'
 *
 * 10. "How does server connect & run?"  | SECTION 14: LAUNCH
 *     - MongoDB URI & Port 5000         | mongoose.connect
 * ============================================================================
 */

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hostguard';
const JWT_SECRET = process.env.JWT_SECRET || 'hostguard_secret_key_12345';

// -------------------------------------------------------------
// SECTION 1: MIDDLEWARE
// -------------------------------------------------------------
app.use(cors());
app.use(express.json());

// -------------------------------------------------------------
// SECTION 2: SCHEMAS
// -------------------------------------------------------------
const UserSchema = new mongoose.Schema({
  userId: { type: String, default: '' },
  name: { type: String, default: '' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['STUDENT', 'GUARD', 'WARDEN', 'ADMIN'], default: 'STUDENT' },
  accountStatus: { type: String, enum: ['ACTIVE', 'BLOCKED', 'INACTIVE'], default: 'ACTIVE' },
  status: { type: String, default: 'ACTIVE' },
  profile: {
    fullName: String,
    rollNumber: String,
    hostelId: String,
    roomNumber: String,
    guardId: String,
    gateId: String,
    phoneNumber: String
  }
}, { timestamps: true });

const StudentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rollNumber: String,
  hostelId: String,
  roomNumber: String,
  currentYear: Number,
  department: String,
  emergencyPhone: String
});

const GuardProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guardId: String,
  gateId: String,
  assignedHostelId: String,
  shiftType: String
});

const WardenProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  wardenId: String,
  assignedHostelId: String,
  officePhone: String
});

const VisitRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  visitor: {
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    identificationType: { type: String, default: 'Aadhaar Card' },
    identificationNumber: { type: String, default: '' }
  },
  hostStudentRollNumber: { type: String, required: true },
  hostelId: { type: String, required: true },
  roomNumber: { type: String, required: true },
  purpose: { type: String, default: 'Campus Visit' },
  visitDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  expectedEntryTime: { type: Date, default: Date.now },
  expectedExitTime: { type: Date, default: () => new Date(Date.now() + 2 * 60 * 60 * 1000) },
  vehicleNumber: { type: String, default: '' },
  accompanyingGuests: [{ name: String }],
  requestStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CHECKED_IN', 'CHECKED_OUT', 'EXPIRED', 'CANCELLED', 'DRAFT'],
    default: 'PENDING'
  },
  rejectionReason: { type: String, default: '' },
  accessToken: { type: String, default: '' }
}, { timestamps: true });

const QRPassSchema = new mongoose.Schema({
  passId: { type: String, required: true, unique: true },
  requestId: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  qrCodeDataUrl: { type: String, required: true },
  status: { type: String, enum: ['ACTIVE', 'CONSUMED', 'EXPIRED'], default: 'ACTIVE' },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }
}, { timestamps: true });

const VisitRecordSchema = new mongoose.Schema({
  recordId: { type: String, required: true, unique: true },
  requestId: { type: String, required: true },
  visitorName: { type: String, required: true },
  hostStudentRollNumber: { type: String, required: true },
  hostelId: { type: String, required: true },
  roomNumber: { type: String, default: '' },
  actualEntryTime: { type: Date, default: Date.now },
  actualExitTime: { type: Date, default: null },
  gateId: { type: String, default: 'MAIN_GATE' }
}, { timestamps: true });

const HostelSchema = new mongoose.Schema({
  hostelId: { type: String, required: true, unique: true },
  hostelName: { type: String, default: '' },
  name: { type: String, default: '' },
  type: { type: String, default: 'BOYS' },
  capacity: { type: Number, default: 400 },
  currentOccupancy: { type: Number, default: 0 }
});

const WorkerSchema = new mongoose.Schema({
  workerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, default: 'MESS' },
  hostelId: { type: String, default: 'BH1' },
  status: { type: String, default: 'ACTIVE' },
  currentlyInside: { type: Boolean, default: false }
});

const GuardAttendanceSchema = new mongoose.Schema({
  guardId: { type: String, required: true },
  guardName: { type: String, default: '' },
  hostelId: { type: String, default: 'BH1' },
  status: { type: String, enum: ['ON_DUTY', 'OFF_DUTY'], default: 'ON_DUTY' },
  checkInTime: { type: Date, default: Date.now },
  checkOutTime: { type: Date, default: null }
}, { timestamps: true });

const NotificationSchema = new mongoose.Schema({
  notificationId: { type: String, required: true },
  recipientUserId: { type: String, default: '' },
  recipientRole: { type: String, default: '' },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

// =============================================================
// ⭐ SAMPLE SCHEMA (Viva Template for Adding New Models)
// Use this if the examiner asks: "Add a new schema/model to MongoDB"
// =============================================================
const SampleFeedbackSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  submittedBy: { type: String, default: 'Student / Visitor' },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN' }
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const StudentProfile = mongoose.models.StudentProfile || mongoose.model('StudentProfile', StudentProfileSchema);
export const GuardProfile = mongoose.models.GuardProfile || mongoose.model('GuardProfile', GuardProfileSchema);
export const WardenProfile = mongoose.models.WardenProfile || mongoose.model('WardenProfile', WardenProfileSchema);
export const VisitRequest = mongoose.models.VisitRequest || mongoose.model('VisitRequest', VisitRequestSchema);
export const QRPass = mongoose.models.QRPass || mongoose.model('QRPass', QRPassSchema);
export const VisitRecord = mongoose.models.VisitRecord || mongoose.model('VisitRecord', VisitRecordSchema);
export const Hostel = mongoose.models.Hostel || mongoose.model('Hostel', HostelSchema);
export const Worker = mongoose.models.Worker || mongoose.model('Worker', WorkerSchema);
export const GuardAttendance = mongoose.models.GuardAttendance || mongoose.model('GuardAttendance', GuardAttendanceSchema);
export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
export const SampleFeedback = mongoose.models.SampleFeedback || mongoose.model('SampleFeedback', SampleFeedbackSchema);

// Helper to attach unified profile object
async function getProfile(user) {
  if (user.profile && user.profile.rollNumber) {
    return user.profile;
  }
  if (user.role === 'STUDENT') {
    const sp = await StudentProfile.findOne({ userId: user._id });
    return {
      fullName: user.name || 'Charith',
      rollNumber: sp?.rollNumber || '24UCS049',
      hostelId: sp?.hostelId || 'BH1',
      roomNumber: sp?.roomNumber || 'B-204'
    };
  }
  if (user.role === 'GUARD') {
    const gp = await GuardProfile.findOne({ userId: user._id });
    return {
      fullName: user.name || 'Gate Guard',
      guardId: gp?.guardId || 'G012',
      gateId: gp?.gateId || 'GATE_BH1',
      hostelId: gp?.assignedHostelId || 'BH1'
    };
  }
  if (user.role === 'WARDEN') {
    const wp = await WardenProfile.findOne({ userId: user._id });
    return {
      fullName: user.name || 'Dr. Sunil Kumar',
      hostelId: wp?.assignedHostelId || 'BH1'
    };
  }
  return { fullName: user.name || 'Chief Security Officer' };
}

// -------------------------------------------------------------
// SECTION 3: AUTH MIDDLEWARE
// -------------------------------------------------------------
const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    
    // Attach profile
    user.profile = await getProfile(user);
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// -------------------------------------------------------------
// SECTION 4: AUTH
// -------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const cleanId = (identifier || '').trim();

    // 1. Find User by email or userId
    let user = await User.findOne({
      $or: [
        { email: cleanId.toLowerCase() },
        { userId: cleanId }
      ]
    }).select('+password');

    // 2. Or search by Student rollNumber
    if (!user) {
      const sp = await StudentProfile.findOne({ rollNumber: cleanId.toUpperCase() });
      if (sp) user = await User.findById(sp.userId).select('+password');
    }

    // 3. Or search by Guard guardId
    if (!user) {
      const gp = await GuardProfile.findOne({ guardId: cleanId.toUpperCase() });
      if (gp) user = await User.findById(gp.userId).select('+password');
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials provided.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials provided.' });
    }

    if (user.accountStatus === 'BLOCKED' || user.status === 'BLOCKED') {
      return res.status(403).json({ success: false, message: 'Account is blocked by administration.' });
    }

    const profile = await getProfile(user);
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        status: user.accountStatus || user.status || 'ACTIVE',
        profile
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/auth/me', auth, (req, res) => {
  res.json({ success: true, user: req.user });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/auth/sso/config', (req, res) => {
  res.json({ enabled: false });
});

// -------------------------------------------------------------
// SECTION 5: REQUESTS
// -------------------------------------------------------------
app.post('/api/requests', async (req, res) => {
  try {
    const {
      visitorName,
      visitorPhone,
      identificationType,
      identificationNumber,
      hostStudentRollNumber,
      hostelId,
      roomNumber,
      purpose,
      visitDate,
      expectedEntryTimeStr,
      expectedExitTimeStr,
      vehicleNumber,
      accompanyingGuests,
      isDraft
    } = req.body;

    const roll = (hostStudentRollNumber || '').toUpperCase();

    // Check host exists and active
    const sp = await StudentProfile.findOne({ rollNumber: roll });
    let host = null;
    if (sp) {
      host = await User.findById(sp.userId);
    } else {
      host = await User.findOne({ email: new RegExp(`^${roll.toLowerCase()}@`, 'i') });
    }

    if (!host && !sp) {
      return res.status(400).json({ success: false, message: `Host student with roll number ${roll} not found.` });
    }
    if (host && (host.accountStatus === 'BLOCKED' || host.status === 'BLOCKED')) {
      return res.status(403).json({ success: false, message: 'Host student account is currently blocked.' });
    }

    // BR-001: 5 Concurrent Active Visitors Quota
    const currentActiveCount = await VisitRequest.countDocuments({
      hostStudentRollNumber: roll,
      requestStatus: { $in: ['APPROVED', 'CHECKED_IN'] }
    });
    if (currentActiveCount >= 5 && !isDraft) {
      return res.status(400).json({
        success: false,
        message: 'Concurrent Visitor Limit Exceeded: Host student currently has 5 active/approved visitors.'
      });
    }

    const randNum = Math.floor(1000 + Math.random() * 9000);
    const requestId = `VR${randNum}`;
    const accessToken = `ACC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newRequest = await VisitRequest.create({
      requestId,
      visitor: {
        fullName: visitorName,
        phoneNumber: visitorPhone,
        identificationType: identificationType || 'Aadhaar Card',
        identificationNumber: identificationNumber || ''
      },
      hostStudentRollNumber: roll,
      hostelId: hostelId || sp?.hostelId || 'BH1',
      roomNumber: roomNumber || sp?.roomNumber || 'B-204',
      purpose: purpose || 'Academic Discussion',
      visitDate: visitDate || new Date().toISOString().split('T')[0],
      vehicleNumber: vehicleNumber || '',
      accompanyingGuests: accompanyingGuests || [],
      requestStatus: isDraft ? 'DRAFT' : 'PENDING',
      accessToken
    });

    res.status(201).json({ success: true, request: newRequest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Student dashboard feed
app.get('/api/requests/student/feed', auth, async (req, res) => {
  try {
    const roll = req.user.profile?.rollNumber || '24UCS049';

    const pendingRequests = await VisitRequest.find({
      hostStudentRollNumber: roll,
      requestStatus: 'PENDING'
    }).sort({ createdAt: -1 });

    const activeVisitors = await VisitRequest.find({
      hostStudentRollNumber: roll,
      requestStatus: { $in: ['APPROVED', 'CHECKED_IN'] }
    }).sort({ updatedAt: -1 });

    const historicalRequests = await VisitRequest.find({
      hostStudentRollNumber: roll
    }).sort({ createdAt: -1 }).limit(50);

    res.json({
      success: true,
      data: {
        pendingRequests,
        activeVisitors,
        quota: {
          currentCount: activeVisitors.length,
          maxQuota: 5
        },
        historicalRequests,
        history: historicalRequests
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/requests/:id', async (req, res) => {
  try {
    const request = await VisitRequest.findOne({ requestId: req.params.id });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    const qrPass = await QRPass.findOne({ requestId: req.params.id });
    res.json({ success: true, request, qrPass });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/requests/:id/approve', auth, async (req, res) => {
  try {
    const request = await VisitRequest.findOne({ requestId: req.params.id });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.requestStatus = 'APPROVED';
    await request.save();

    const token = `TKN-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const qrCodeDataUrl = await QRCode.toDataURL(token);

    const qrPass = await QRPass.create({
      passId: `PASS-${Math.floor(1000 + Math.random() * 9000)}`,
      requestId: request.requestId,
      token,
      qrCodeDataUrl,
      status: 'ACTIVE'
    });

    res.json({ success: true, request, qrPass });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/requests/:id/reject', auth, async (req, res) => {
  try {
    const request = await VisitRequest.findOne({ requestId: req.params.id });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.requestStatus = 'REJECTED';
    request.rejectionReason = req.body.reason || 'Host rejected visit request.';
    await request.save();

    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/requests/:id/cancel', async (req, res) => {
  try {
    const request = await VisitRequest.findOne({ requestId: req.params.id });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.requestStatus = 'CANCELLED';
    await request.save();

    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/requests/:id', async (req, res) => {
  try {
    const request = await VisitRequest.findOne({ requestId: req.params.id });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (req.body.visitorName) request.visitor.fullName = req.body.visitorName;
    if (req.body.visitorPhone) request.visitor.phoneNumber = req.body.visitorPhone;
    if (req.body.purpose) request.purpose = req.body.purpose;
    if (req.body.vehicleNumber !== undefined) request.vehicleNumber = req.body.vehicleNumber;
    await request.save();

    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/requests/:id/submit', async (req, res) => {
  try {
    const request = await VisitRequest.findOne({ requestId: req.params.id });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.requestStatus = 'PENDING';
    await request.save();

    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// SECTION 6: GATE
// -------------------------------------------------------------
app.get('/api/gate/verify', async (req, res) => {
  try {
    const code = (req.query.token || req.query.code || '').trim().toUpperCase();

    let qrPass = await QRPass.findOne({ token: code });
    let request = null;

    if (qrPass) {
      request = await VisitRequest.findOne({ requestId: qrPass.requestId });
    } else {
      request = await VisitRequest.findOne({ requestId: code });
      if (request) {
        qrPass = await QRPass.findOne({ requestId: request.requestId });
      }
    }

    if (!request) {
      return res.status(404).json({
        success: false,
        data: { status: 'INVALID', message: 'Pass not found or code invalid.' }
      });
    }

    let status = 'VALID';
    let message = 'Pass verified. Clear for entry.';

    if (request.requestStatus === 'CHECKED_IN') {
      status = 'ACTIVE_INSIDE';
      message = 'Visitor currently inside hostel.';
    } else if (request.requestStatus === 'CHECKED_OUT') {
      status = 'ALREADY_CONSUMED';
      message = 'Pass already consumed and checked out.';
    } else if (request.requestStatus !== 'APPROVED') {
      status = 'INVALID';
      message = `Pass is ${request.requestStatus}. Entry not permitted.`;
    }

    res.json({
      success: true,
      data: {
        status,
        message,
        request,
        pass: qrPass
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/gate/checkin', async (req, res) => {
  try {
    const { requestId, gateId } = req.body;
    const request = await VisitRequest.findOne({ requestId });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.requestStatus === 'CHECKED_IN') {
      return res.status(400).json({ success: false, message: 'Visitor is already checked in.' });
    }
    if (request.requestStatus === 'CHECKED_OUT') {
      return res.status(400).json({ success: false, message: 'Pass already consumed.' });
    }
    if (request.requestStatus !== 'APPROVED') {
      return res.status(400).json({ success: false, message: `Cannot check in request with status ${request.requestStatus}` });
    }

    request.requestStatus = 'CHECKED_IN';
    await request.save();

    await QRPass.updateOne({ requestId }, { status: 'CONSUMED' });

    const record = await VisitRecord.create({
      recordId: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      requestId: request.requestId,
      visitorName: request.visitor.fullName,
      hostStudentRollNumber: request.hostStudentRollNumber,
      hostelId: request.hostelId,
      roomNumber: request.roomNumber,
      actualEntryTime: new Date(),
      gateId: gateId || 'GATE_BH1'
    });

    res.json({ success: true, request, record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/gate/checkout', async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = await VisitRequest.findOne({ requestId });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.requestStatus !== 'CHECKED_IN') {
      return res.status(400).json({ success: false, message: 'Visitor is not currently checked in.' });
    }

    request.requestStatus = 'CHECKED_OUT';
    await request.save();

    await VisitRecord.updateOne(
      { requestId, actualExitTime: null },
      { actualExitTime: new Date() }
    );

    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/gate/active-visitors', async (req, res) => {
  try {
    const query = { requestStatus: 'CHECKED_IN' };
    if (req.query.hostelId) query.hostelId = req.query.hostelId;
    const active = await VisitRequest.find(query).sort({ updatedAt: -1 });
    res.json({ success: true, data: active });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// SECTION 7: ATTENDANCE
// -------------------------------------------------------------
app.post('/api/attendance/checkin', auth, async (req, res) => {
  try {
    const guardId = req.user.profile?.guardId || 'G012';
    const guardName = req.user.profile?.fullName || 'Gate Guard';
    const hostelId = req.body.hostelId || req.user.profile?.hostelId || 'BH1';

    const attendance = await GuardAttendance.create({
      guardId,
      guardName,
      hostelId,
      status: 'ON_DUTY',
      checkInTime: new Date()
    });

    res.json({ success: true, attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/attendance/checkout', auth, async (req, res) => {
  try {
    const guardId = req.user.profile?.guardId || 'G012';
    const attendance = await GuardAttendance.findOneAndUpdate(
      { guardId, status: 'ON_DUTY' },
      { status: 'OFF_DUTY', checkOutTime: new Date() },
      { new: true }
    );
    res.json({ success: true, attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/attendance/my-status', auth, async (req, res) => {
  try {
    const guardId = req.user.profile?.guardId || 'G012';
    const shift = await GuardAttendance.findOne({ guardId, status: 'ON_DUTY' }).sort({ createdAt: -1 });
    res.json({
      success: true,
      isOnDuty: Boolean(shift),
      currentShift: shift || { status: 'OFF_DUTY', hostelId: 'BH1' }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/attendance/all', async (req, res) => {
  try {
    const records = await GuardAttendance.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, attendance: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/attendance/guards', async (req, res) => {
  try {
    const guards = await User.find({ role: 'GUARD' });
    res.json({ success: true, guards });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/attendance/assignments', (req, res) => res.json({ success: true, assignments: [] }));
app.post('/api/attendance/assignments', (req, res) => res.json({ success: true }));
app.delete('/api/attendance/assignments/:id', (req, res) => res.json({ success: true }));

// -------------------------------------------------------------
// SECTION 8: WARDEN
// -------------------------------------------------------------
app.get('/api/warden/dashboard', async (req, res) => {
  try {
    const hostelId = req.query.hostelId || 'BH1';

    const activeVisitors = await VisitRequest.find({
      hostelId,
      requestStatus: 'CHECKED_IN'
    }).sort({ updatedAt: -1 });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayTotalEntries = await VisitRecord.countDocuments({
      hostelId,
      actualEntryTime: { $gte: todayStart }
    });

    const now = new Date();
    const overdueVisitors = activeVisitors.filter(v => new Date(v.expectedExitTime) < now);
    const recentLogs = await VisitRecord.find({ hostelId }).sort({ actualEntryTime: -1 }).limit(20);

    res.json({
      success: true,
      data: {
        activeVisitorsCount: activeVisitors.length,
        todayTotalEntries,
        overdueCount: overdueVisitors.length,
        hostelOccupancy: 342,
        activeVisitors,
        overdueVisitors,
        recentLogs
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/warden/alerts', async (req, res) => {
  try {
    const now = new Date();
    const overstays = await VisitRequest.find({
      requestStatus: 'CHECKED_IN',
      expectedExitTime: { $lt: now }
    });

    const alerts = overstays.map(req => ({
      _id: req._id,
      alertId: `ALT-${req.requestId}`,
      type: 'OVERSTAY',
      visitorName: req.visitor.fullName,
      hostRollNumber: req.hostStudentRollNumber,
      hostelId: req.hostelId,
      roomNumber: req.roomNumber,
      message: `Visitor ${req.visitor.fullName} exceeded expected exit window at ${req.hostelId}`,
      createdAt: req.updatedAt
    }));

    res.json({ success: true, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/warden/alerts/:id/acknowledge', (req, res) => {
  res.json({ success: true, message: 'Alert acknowledged' });
});

app.patch('/api/warden/students/:roll/status', async (req, res) => {
  try {
    const student = await User.findOneAndUpdate(
      { 'profile.rollNumber': req.params.roll.toUpperCase() },
      { status: req.body.status, accountStatus: req.body.status },
      { new: true }
    );
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// SECTION 9: WORKERS
// -------------------------------------------------------------
app.get('/api/workers', async (req, res) => {
  try {
    const query = req.query.hostelId ? { hostelId: req.query.hostelId } : {};
    const workers = await Worker.find(query);
    res.json({ success: true, workers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/workers', async (req, res) => {
  try {
    const worker = await Worker.create({
      workerId: `WRK-${Math.floor(1000 + Math.random() * 9000)}`,
      name: req.body.name,
      category: req.body.category || 'MESS',
      hostelId: req.body.hostelId || 'BH1'
    });
    res.status(201).json({ success: true, worker });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/workers/gate-activity', async (req, res) => {
  try {
    const worker = await Worker.findOne({ workerId: req.body.workerId });
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });

    worker.currentlyInside = !worker.currentlyInside;
    await worker.save();

    res.json({
      success: true,
      worker,
      message: `Worker ${worker.name} marked as ${worker.currentlyInside ? 'INSIDE' : 'OUTSIDE'}`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// SECTION 10: ADMIN
// -------------------------------------------------------------
app.get('/api/admin/overview', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVisits = await VisitRecord.countDocuments();
    const activeVisitors = await VisitRequest.countDocuments({ requestStatus: 'CHECKED_IN' });
    const hostels = await Hostel.find();

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalVisits,
        activeVisitors,
        systemHealth: 'OPERATIONAL'
      },
      hostels
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/admin/users/:userId/status', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { status: req.body.status, accountStatus: req.body.status }, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/admin/users/:userId/role', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role: req.body.role, profile: req.body.profile },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/audit-logs', (req, res) => res.json({ success: true, logs: [] }));
app.get('/api/admin/directory/status', (req, res) => res.json({ success: true, status: { configured: false } }));
app.post('/api/admin/directory/sync', (req, res) => res.json({ success: true, message: 'Sync complete' }));

// -------------------------------------------------------------
// SECTION 11: NOTIFICATIONS & REPORTS
// -------------------------------------------------------------
app.get('/api/notifications', async (req, res) => {
  try {
    const notifs = await Notification.find().sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, notifications: notifs, unreadCount: notifs.filter(n => !n.isRead).length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/notifications/read-all', async (req, res) => {
  await Notification.updateMany({ isRead: false }, { isRead: true });
  res.json({ success: true });
});

app.get('/api/reports/visits', async (req, res) => {
  try {
    const records = await VisitRecord.find().sort({ actualEntryTime: -1 }).limit(100);
    res.json({ success: true, reports: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// SECTION 12: SAMPLE CRUD
// -------------------------------------------------------------
// 1. Create a document (POST)
app.post('/api/feedback', async (req, res) => {
  try {
    const item = await SampleFeedback.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 2. Read documents (GET)
app.get('/api/feedback', async (req, res) => {
  try {
    const items = await SampleFeedback.find().sort({ createdAt: -1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -------------------------------------------------------------
// SECTION 13: STATIC FRONTEND
// -------------------------------------------------------------
const distPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// -------------------------------------------------------------
// SECTION 14: LAUNCH
// -------------------------------------------------------------
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`[HostGuard DB] Connected to MongoDB: ${MONGO_URI}`);
    app.listen(PORT, () => {
      console.log(`[HostGuard Server] Running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[HostGuard DB Error]:', err.message);
  });

export default app;
