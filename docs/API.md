# HostGuard REST API Specification (docs/API.md)

**Project:** HostGuard — Visitor Entry Management System  
**Institution:** The LNM Institute of Information Technology, Jaipur (LNMIIT)  
**Course:** CS314 Software Development Laboratory  
**Base URL:** `http://localhost:5000/api`  

---

## 1. Authentication & Session Management

### `POST /api/auth/login`
Authenticates registered institutional users (`STUDENT`, `GUARD`, `WARDEN`, `ADMIN`).
- **Request Body:**
  ```json
  {
    "identifier": "24ucs049@lnmiit.ac.in",
    "password": "Password@123"
  }
  ```
  *(Identifier accepts institutional email, student roll number, or guard ID).*
- **Responses:**
  - `200 OK`: Sets secure HTTP-only cookie and returns JWT token and profile.
  - `401 Unauthorized`: Generic error ("Invalid credentials provided.") per FR-002 without leaking email existence.
  - `403 Forbidden`: Account is `BLOCKED` or `INACTIVE` per FR-007.

### `POST /api/auth/logout`
Terminates active session and clears authentication cookies (FR-003).

### `GET /api/auth/me`
Fetches current authenticated user and linked role profile.

---

## 2. Visit Request Lifecycle

### `POST /api/requests`
Submit a new visitor request (Visitor Self-Registration at Gate kiosk or Student Pre-Registration).
- **Request Body:**
  ```json
  {
    "visitorName": "Ananya Deshmukh",
    "visitorPhone": "+91 98292 33445",
    "identificationType": "Government ID",
    "identificationNumber": "ID4521",
    "hostStudentRollNumber": "24UCS049",
    "hostelId": "BH1",
    "roomNumber": "B-201",
    "purpose": "Family visit & luggage drop-off",
    "visitDate": "2026-10-26",
    "expectedEntryTimeStr": "16:00",
    "expectedExitTimeStr": "18:30",
    "accompanyingGuests": []
  }
  ```
- **Rules Enforced:**
  - `BR-004`: Permissible hours 06:00 to 19:00 IST.
  - `BR-005`: Same-day entry cutoff 18:40 IST.
  - `BR-011`: Host concurrent quota (max 5 active visitors).
  - `BR-012`: Hostel Room Containment.

### `GET /api/requests/:id`
Retrieves request status and dynamic QR Pass (if approved) by `requestId` or `accessToken`.

### `GET /api/requests/student/feed`
Fetches host student's pending requests and personal historical records.

### `POST /api/requests/:requestId/approve`
Host student approves pending visit request (FR-022). Generates dynamic QR Pass.
- Rejects if request is older than 20 minutes (BR-006).
- Rejects if student active visitors >= 5 (BR-001).

### `POST /api/requests/:requestId/reject`
Host student declines visit request with optional reason (FR-024, FR-025).

---

## 3. Gate Operations & Verification

### `GET /api/gate/verify`
Query parameters: `?token=...` or `?requestId=...` or `?phone=...` or `?rollNumber=...`.
- Verifies request is `APPROVED` (BR-007).
- Verifies current time within official visiting hours (06:00 to 19:00).
- Verifies pass is not expired or previously consumed (BR-008).

### `POST /api/gate/checkin`
Records visitor arrival at hostel gate (FR-032).
- Requires active guard shift check-in today (BR-011).
- Creates `VisitRecord` with server timestamp.
- Prevents duplicate entry check-in (FR-034).

### `POST /api/gate/checkout`
Records visitor departure (FR-035).
- Stamps server `exitTime` and closes session.
- Calculates overstay status dynamically (BR-010).
- Permanently invalidates pass against re-entry (BR-008).
- Decrements active occupancy and restores student quota.

### `GET /api/gate/active-visitors`
Returns all visitors currently inside hostel premises.

---

## 4. Guard Attendance

### `POST /api/attendance/checkin`
Clocks in guard for duty shift at designated hostel (FR-043).
### `POST /api/attendance/checkout`
Clocks out guard upon shift completion (FR-044).
### `GET /api/attendance/my-status`
Returns current guard shift state (BR-011 active duty validation).

---

## 5. Hostel Warden Operations

### `GET /api/warden/dashboard`
Returns live inside visitors, overstay alerts queue, today's traffic summary, and guards on duty.
### `GET /api/warden/alerts`
Retrieves open overstay alerts.
### `POST /api/warden/alerts/:alertId/acknowledge`
Acknowledge overstay alert and record disciplinary notes.
### `PATCH /api/warden/students/:rollNumber/status`
Updates student status (`ACTIVE`, `INACTIVE`, `BLOCKED`) (FR-006, BR-002).

---

## 6. Staff & Worker Operations

### `GET /api/workers`
Lists registered campus maintenance staff.
### `POST /api/workers`
Registers maintenance worker by category (`PERMANENT`, `CONTRACT`, `DAILY`) (FR-047).
### `POST /api/workers/gate-activity`
Logs entry/exit of maintenance personnel with facility authorization validation (FR-048).

---

## 7. Reports & Security Audit

### `GET /api/reports/history`
Multi-criteria searchable visit log (date range, roll number, visitor name, guard ID, overstay status).
### `GET /api/reports/daily-summary`
Daily traffic audit report with totals, exits, active visits, and overstay violations (FR-051).
