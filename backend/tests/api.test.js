import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedDatabase } from '../src/seeds/seedData.js';
import { setMockTime } from '../src/utils/timeUtils.js';

describe('HostGuard Full-Stack API Integration Tests', () => {
  let studentToken = '';
  let guardToken = '';
  let wardenToken = '';
  let adminToken = '';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    // Use controlled clock during daytime visiting hours (12:00 PM) for time-dependent tests
    setMockTime('2026-10-26T12:00:00+05:30');
    await connectDB();
    await seedDatabase();

    // Login Student
    const stuRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: '24ucs049@lnmiit.ac.in', password: 'Password@123' });
    studentToken = stuRes.body.token;

    // Login Guard
    const guardRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'guard1@lnmiit.ac.in', password: 'Password@123' });
    guardToken = guardRes.body.token;

    // Login Warden
    const wardenRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'warden.bh1@lnmiit.ac.in', password: 'Password@123' });
    wardenToken = wardenRes.body.token;

    // Login Admin
    const admRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'admin@lnmiit.ac.in', password: 'Password@123' });
    adminToken = admRes.body.token;
  }, 30000);

  afterAll(async () => {
    setMockTime(null);
    await disconnectDB();
  });

  describe('1. Authentication & RBAC (FR-001 - FR-007)', () => {
    test('FR-001: Successfully logs in with valid credentials and returns token', () => {
      expect(studentToken).toBeDefined();
      expect(guardToken).toBeDefined();
    });

    test('FR-002: Rejects invalid credentials with generic error message', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: '24ucs049@lnmiit.ac.in', password: 'WrongPassword' });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid credentials provided.');
    });

    test('FR-007 & BR-002: Denies login for BLOCKED users', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'suspended@lnmiit.ac.in', password: 'Password@123' });
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/blocked/i);
    });

    test('FR-005: Enforces RBAC - Student cannot access Warden dashboard', async () => {
      const res = await request(app)
        .get('/api/warden/dashboard')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('2. Visit Request Lifecycle & Business Rules', () => {
    test('FR-009, FR-010: Visitor can self-register a visit request at the gate', async () => {
      const res = await request(app)
        .post('/api/requests')
        .send({
          visitorName: 'Sunita Sharma (Parent)',
          visitorPhone: '+91 99887 76655',
          identificationType: 'Aadhaar Card',
          identificationNumber: '1122-3344-5566',
          hostStudentRollNumber: '24UCS051',
          hostelId: 'BH2',
          roomNumber: 'A-105',
          purpose: 'Semester meeting',
          visitDate: '2026-10-27',
          expectedEntryTimeStr: '10:00',
          expectedExitTimeStr: '12:00',
          accompanyingGuests: []
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.request.requestId).toBeDefined();
      expect(res.body.request.requestStatus).toBe('PENDING');
    });

    test('FR-011: Enforces quota limit of max 5 visitors per request', async () => {
      const res = await request(app)
        .post('/api/requests')
        .send({
          visitorName: 'Group Leader',
          visitorPhone: '+91 99887 11111',
          identificationType: 'Aadhaar Card',
          identificationNumber: '1111-2222-3333',
          hostStudentRollNumber: '24UCS051',
          hostelId: 'BH2',
          roomNumber: 'A-105',
          purpose: 'Group Study',
          visitDate: '2026-10-27',
          expectedEntryTimeStr: '11:00',
          expectedExitTimeStr: '13:00',
          accompanyingGuests: [
            { name: 'Guest 1' },
            { name: 'Guest 2' },
            { name: 'Guest 3' },
            { name: 'Guest 4' },
            { name: 'Guest 5' } // 1 primary + 5 guests = 6 (exceeds 5)
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Exceeded maximum visitors allowed/i);
    });

    test('BR-012: Enforces Hostel Room Containment', async () => {
      // 24UCS051 belongs to BH2 Room A-105, not BH1 Room B-201
      const res = await request(app)
        .post('/api/requests')
        .send({
          visitorName: 'Misrouted Visitor',
          visitorPhone: '+91 99887 22222',
          identificationType: 'Aadhaar Card',
          identificationNumber: '2222-3333-4444',
          hostStudentRollNumber: '24UCS051',
          hostelId: 'BH1', // Wrong hostel
          roomNumber: 'B-201',
          purpose: 'Meeting',
          visitDate: '2026-10-27',
          expectedEntryTimeStr: '11:00',
          expectedExitTimeStr: '12:00'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Hostel Room Containment/i);
    });

    test('FR-022, FR-027: Student approves request -> status changes to APPROVED & QR Pass issued', async () => {
      // Request VR2001 was seeded in PENDING for 24UCS049
      const res = await request(app)
        .post('/api/requests/VR2001/approve')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.request.requestStatus).toBe('APPROVED');
      expect(res.body.qrPass).toBeDefined();
      expect(res.body.qrPass.token).toBeDefined();
      expect(res.body.qrPass.qrCodeDataUrl).toMatch(/^data:image\/png;base64/);
    });
  });

  describe('3. Gate Operations (FR-029 - FR-036, BR-007, BR-008, BR-011)', () => {
    test('FR-031 & BR-007: Guard verifies approved QR Pass (TKN-A45X9 for VR2045)', async () => {
      const res = await request(app)
        .get('/api/gate/verify?token=TKN-A45X9')
        .set('Authorization', `Bearer ${guardToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isValid).toBe(true);
      expect(res.body.data.visitRequest.requestId).toBe('VR2045');
    });

    test('FR-032 & FR-033: Guard records gate check-in for verified pass', async () => {
      const res = await request(app)
        .post('/api/gate/checkin')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          passToken: 'TKN-A45X9',
          requestId: 'VR2045'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.visitRecord.entryTime).toBeDefined();
      expect(res.body.visitRecord.guardId).toBe('G012');
    });

    test('FR-034: Duplicate entry check-in attempt is rejected', async () => {
      const res = await request(app)
        .post('/api/gate/checkin')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          passToken: 'TKN-A45X9',
          requestId: 'VR2045'
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/marked inside/i);
    });

    test('FR-035, FR-036 & BR-008: Guard records checkout and pass is consumed', async () => {
      const res = await request(app)
        .post('/api/gate/checkout')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          token: 'TKN-A45X9'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.visitRecord.exitTime).toBeDefined();

      // BR-008: Attempting re-entry with consumed pass must fail
      const retryRes = await request(app)
        .post('/api/gate/checkin')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          passToken: 'TKN-A45X9',
          requestId: 'VR2045'
        });

      expect(retryRes.status).toBe(400);
      expect(retryRes.body.message).toMatch(/Pass already consumed/i);
    });
  });

  describe('4. Worker Facility Authorization (FR-047, FR-048)', () => {
    test('FR-048: Denies worker entry if assigned to another hostel', async () => {
      // WRK103 is assigned to BH2, gate guard G012 is stationed at BH1
      const res = await request(app)
        .post('/api/workers/gate-activity')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          workerId: 'WRK103',
          action: 'ENTRY'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Facility Authorization Denied/i);
    });

    test('FR-047: Allows worker entry to their authorized hostel', async () => {
      // WRK101 is assigned to BH1
      const res = await request(app)
        .post('/api/workers/gate-activity')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          workerId: 'WRK101',
          action: 'ENTRY'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.worker.currentlyInside).toBe(true);
    });
  });

  describe('5. Warden Monitoring & Reporting (FR-038 - FR-042, FR-049 - FR-051)', () => {
    test('FR-039, FR-040: Warden dashboard retrieves live occupancy and overstay alerts', async () => {
      const res = await request(app)
        .get('/api/warden/dashboard?hostelId=BH1')
        .set('Authorization', `Bearer ${wardenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.hostelId).toBe('BH1');
      expect(res.body.data.activeVisitors).toBeDefined();
      expect(res.body.data.openOverstayAlertsCount).toBeGreaterThanOrEqual(1);
    });

    test('FR-051: Warden generates daily traffic summary report', async () => {
      const res = await request(app)
        .get('/api/reports/daily-summary?hostelId=BH1')
        .set('Authorization', `Bearer ${wardenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.report.summary.totalEntries).toBeGreaterThanOrEqual(1);
    });
  });
});
