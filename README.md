# 🛡️ HostGuard — Visitor Entry Management System
**Institutional Platform for University Hostel Access Control & Security Operations**  
**Institution:** The LNM Institute of Information Technology, Jaipur (LNMIIT)  
**Course:** CS314 — Software Development Laboratory  
**Team ID:** T049 (Specification Source: `T049(1).pdf`)  
**Team Members:**
- Malapati Charith (24UCS049) — Project & Requirements Lead
- Atharva Sharma (24UCS050) — System Architecture & Design Lead
- Raghav Gupta (24UCS051) — Full-Stack Development Lead
- Rudraksh Tank (24UCS052) — Quality Assurance & Testing Lead

---

## 📑 Quick Navigation
- [1. System Overview & Architecture](#1-system-overview--architecture)
- [2. Institutional Business Rules (BR-001 to BR-012)](#2-institutional-business-rules)
- [3. Five User Roles & Consoles](#3-five-user-roles--consoles)
- [4. Database Schemas & Data Model](#4-database-schemas--data-model)
- [5. Quick Start & Viva Demonstration](#5-quick-start--viva-demonstration)
- [6. Automated Test Suite (25/25 Tests Passing)](#6-automated-test-suite)
- [7. On-the-Spot Viva Modifications Guide](#7-on-the-spot-viva-modifications-guide)
- [8. Documentation Directory](#8-documentation-directory)

---

## 1. System Overview & Architecture

HostGuard replaces vulnerable physical paper logbooks with an end-to-end cryptographic access control platform. It manages the complete lifecycle of campus visitors, guest approvals, optical QR gate scanning, real-time overstay alerts, service staff tracking, and warden disciplinary controls.

```
                              ┌─────────────────────────────────────────┐
                              │            HOSTGUARD CLIENT             │
                              │       (React 18 + Vite + Tailwind)      │
                              └────────────────────┬────────────────────┘
                                                   │
                                     REST API / JWT Session
                                                   │
                              ┌────────────────────▼────────────────────┐
                              │         EXPRESS.JS / NODE.JS            │
                              │        (Modular Monolith API)           │
                              ├─────────────────────────────────────────┤
                              │ • Auth & RBAC Middleware                │
                              │ • Business Rules Engine (BR-001..BR-012)│
                              │ • QR Crypto Engine (qrcode + crypto)    │
                              │ • 30-Second Overstay Background Cron    │
                              └────────────────────┬────────────────────┘
                                                   │
                                       Mongoose ODM Driver
                                                   │
                              ┌────────────────────▼────────────────────┐
                              │           MONGODB DATABASE              │
                              │ (Hostels, Users, Requests, Passes,      │
                              │  Visits, Attendance, Alerts, AuditLogs) │
                              └─────────────────────────────────────────┘
```

### Complete Visitor Entry Flow
```
Visitor Applies        Host Student            QR Pass Generated       Gate Guard Scans       Check-Out
 (Kiosk / Phone)  ──►  (Approve / Reject) ──►  (Encrypted Token)  ──►  (Validates Entry) ──►  (Pass Consumed,
   [PENDING]              [APPROVED]               [ACTIVE]               [CHECKED IN]         Overstay Evaluated)
```

---

## 2. Institutional Business Rules

Every business rule from the 59-page project specification `T049(1).pdf` is strictly validated server-side:

| Rule | Formal Specification | Implementation File | Verification Test |
|---|---|---|---|
| **BR-001** | **Host Concurrent Quota:** A host student can have at most **5 active visitors** inside the hostel simultaneously. | `backend/src/services/visitRequestService.js` | `api.test.js` & `businessRules.test.js` |
| **BR-002** | **Disciplinary Suspension:** Blocked, suspended, or inactive students are prohibited from creating or approving requests. | `backend/src/services/visitRequestService.js` | `api.test.js` (Status 403) |
| **BR-003** | **Self-Hosting Prohibition:** A host student cannot create or approve a visit request for themselves. | `backend/src/services/visitRequestService.js` | `businessRules.test.js` |
| **BR-004** | **Official Visiting Window:** Gate visits strictly permitted between **06:00 and 19:00 IST**. | `backend/src/utils/timeUtils.js` | `businessRules.test.js` |
| **BR-005** | **Late Approval Cutoff:** Same-day requests cannot be initiated or approved after **18:40 IST**. | `backend/src/utils/timeUtils.js` | `businessRules.test.js` |
| **BR-006** | **20-Minute Approval Window:** Pending requests expire if host does not act within 20 minutes. | `backend/src/jobs/scheduler.js` | `businessRules.test.js` |
| **BR-007** | **Mandatory Prior Approval:** Gate entry requires prior status of `APPROVED`. Drafts/Pending cannot enter. | `backend/src/services/gateService.js` | `api.test.js` |
| **BR-008** | **Single Pass Execution:** Each QR pass permits exactly **0..1 entries**. Consumed passes cannot be reused. | `backend/src/services/gateService.js` | `api.test.js` (Status 400) |
| **BR-009** | **Sequential Gate State:** Check-out strictly requires a valid preceding non-null gate check-in. | `backend/src/services/gateService.js` | `api.test.js` |
| **BR-010** | **Dynamic Overstay Calculation:** Visitors inside past expected exit or 19:00 trigger critical overstay alerts. | `backend/src/services/overstayService.js` | `api.test.js` & `businessRules.test.js` |
| **BR-011** | **Guard Active Shift Requirement:** Security guards must clock-in for an active shift before gate ops. | `backend/src/services/guardAttendanceService.js` | `api.test.js` (Status 403) |
| **BR-012** | **Hostel Room Containment:** A host student can only host guests in their assigned hostel block and room. | `backend/src/services/visitRequestService.js` | `api.test.js` |

---

## 3. Five User Roles & Consoles

HostGuard is designed with 5 distinct role-based perspectives:

### 1. Security Guard Terminal (`/guard`)
* **Live Duty Shift Toggle:** Required before processing entries (`BR-011`). Shows a glowing real-time LED indicator.
* **Optical Camera Scanner & Manual Fallback:** Live camera scanner using `html5-qrcode` + instant token lookup (`FR-037`).
* **Clearance Dossier:** Displays visitor government ID, photo record, host roll number, room allocation, and single-click entry authorization.
* **Active Gate Feed:** Real-time occupancy list with red flashing overstay tags.
* **Service Staff Tab:** One-click entry/exit tracking for plumbers, electricians, and contractors (`FR-047`).

### 2. Student Host Workspace (`/student`)
* **5-Dot Visual Quota Gauge:** Displays live active visitor count against the 5-person concurrent limit (`BR-001`).
* **Approval Cards with 20-Min Countdown:** Live countdown timer showing minutes/seconds remaining before automatic expiry (`BR-006`).
* **One-Click Decision:** Approve and issue dynamic QR pass, or reject with optional disciplinary reason (`BR-003`).
* **Pre-Registration Studio:** Pre-register family, friends, or project collaborators ahead of time (`FR-016`).

### 3. Hostel Warden Operations Center (`/warden`)
* **Sector Selector:** Switch between `BH1`, `BH2`, `BH3`, `BH4`, `BH5`, and `GH`.
* **Critical Overstay Incident Queue:** Visual alerts for visitors exceeding the 19:00 cutoff with disciplinary note resolution (`BR-010`).
* **Discipline & Status Control:** Search any student roll number and toggle status to `ACTIVE`, `SUSPENDED`, or `BLOCKED` (`BR-002`).
* **Staff Registry:** Enroll service personnel categorized by `PERMANENT`, `CONTRACT`, and `DAILY` (`FR-045`).
* **Daily Summary Reports:** Automated statistical breakdown of admissions, peak traffic, and overstays (`FR-043`).

### 4. System Administrator Flight Deck (`/admin`)
* **User & RBAC Matrix:** Search, filter, change roles (`STUDENT`, `GUARD`, `WARDEN`, `ADMIN`), and block/activate accounts.
* **Immutable Forensic Audit Trail:** Terminal-grade audit log viewer (`NFR-020`) tracking timestamp, user, role, action, and payload telemetry.
* **Hostel Facility Overview:** Live occupancy metrics across all campus hostels.

### 5. Visitor Self-Registration Kiosk (`/visitor`)
* **Unauthenticated Access:** Public kiosk where visiting parents or guests register without needing university credentials.
* **Single-Entry Digital QR Pass (`/pass/:id`):** Displays dynamic QR code, pass token, schedule window, and physical ID verification guidelines.

---

## 4. Database Schemas & Data Model

HostGuard uses 12 well-indexed MongoDB collections:

```
┌──────────────┐          ┌──────────────────┐          ┌─────────────────┐
│     User     ├─────────►│  StudentProfile  │          │     Hostel      │
│  (Auth/Role) │          │(Roll, Hostel, Rm)│          │ (BH1..5, GH)    │
└──────┬───────┘          └────────┬─────────┘          └────────┬────────┘
       │                           │                             │
       │                           ▼                             │
       │                  ┌──────────────────┐                   │
       │                  │   VisitRequest   │◄──────────────────┘
       │                  │ (Visitor, Status)│
       │                  └────────┬─────────┘
       │                           │
       │                           ▼
       │                  ┌──────────────────┐
       ├─────────────────►│      QRPass      │
       │                  │ (Token, Validity)│
       │                  └────────┬─────────┘
       │                           │
       │                           ▼
       │                  ┌──────────────────┐
       └─────────────────►│   VisitRecord    │ (Gate Check-In & Check-Out)
                          └────────┬─────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │  OverstayAlert   │ (Generated when visit breaches 19:00)
                          └──────────────────┘
```

---

## 5. Quick Start & Viva Demonstration

### 1. Installation & Environment Setup
```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Seed realistic evaluation database
cd ..
npm run seed

# 3. Build frontend bundle
npm run build

# 4. Start the application
npm start
```
Open **`http://localhost:5000`** in your browser.

---

### 2. Viva Evaluation Accounts (Password: `Password@123`)

The Login page includes **1-click quick-fill buttons** for instant evaluation:

| Role | Email Identifier | Alternate ID | View / Capabilities |
|---|---|---|---|
| **Security Guard** | `guard1@lnmiit.ac.in` | `G012` | Gate Terminal, QR Scanner, Entry/Exit Logging |
| **Host Student** | `24ucs049@lnmiit.ac.in` | `24UCS049` | Quota Gauge, 20m Countdown, Approve/Reject |
| **Hostel Warden** | `warden.bh1@lnmiit.ac.in` | — | Overstay Queue, Student Disciplinary Block, Reports |
| **Administrator** | `admin@lnmiit.ac.in` | — | RBAC Matrix, Forensic Audit Trail (100 events) |
| **Guest / Visitor** | *No login needed* | — | Visitor Kiosk at `/visitor` & Pass at `/pass/VR2045` |

---

## 6. Automated Test Suite

HostGuard features a test suite covering business rules, edge cases, and API integration.

To run the automated tests:
```bash
cd backend
npm test
```

### Test Coverage Highlights:
* **`tests/businessRules.test.js` (9 Tests):**
  * `BR-004`: Permitted visiting hours (06:00 to 19:00).
  * `BR-005`: Late approval cutoff (18:40 IST boundary).
  * `BR-006`: 20-minute pending request expiration calculation.
  * `BR-010`: Overstay detection logic when expected exit or 19:00 is exceeded.
* **`tests/api.test.js` (16 Tests):**
  * End-to-end authentication & invalid credentials handling.
  * Student request creation, self-hosting prohibition (`BR-003`), quota enforcement (`BR-001`).
  * Approval lifecycle, dynamic QR pass creation, and student suspension check (`BR-002`).
  * Gate check-in with active guard shift (`BR-011`) and duplicate entry rejection.
  * Single-use pass invalidation upon checkout (`BR-008`).
  * Service worker unauthorized facility rejection (`FR-048`).
  * Warden overstay alert query and daily summary report generation.

**Result:** `Test Suites: 2 passed, 2 total | Tests: 25 passed, 25 total (100% Pass)`.

---

## 7. On-the-Spot Viva Modifications Guide

If the professor asks you to modify functionality during your viva, refer to these quick locations:

* **Change Quotas or Hours:** Open [`backend/src/config/constants.js`](file:///c:/Users/ragha/swelab/backend/src/config/constants.js). Edit `HOST_MAX_CONCURRENT_VISITORS` or `VISITING_END_HOUR`.
* **Add Visitor Fields (e.g., Vehicle Number):** Already wired in [`backend/src/models/VisitRequest.js`](file:///c:/Users/ragha/swelab/backend/src/models/VisitRequest.js) under `visitor.vehicleNumber`!
* **Adjust 20-Minute Expiration:** Open [`backend/src/config/constants.js`](file:///c:/Users/ragha/swelab/backend/src/config/constants.js) and change `APPROVAL_TIMEOUT_MINUTES`.
* **Full Q&A and Viva Walkthrough:** Check [`VIVA_GUIDE.md`](file:///c:/Users/ragha/swelab/VIVA_GUIDE.md) for 15+ answered examiner questions and step-by-step viva script!

---

## 8. Documentation Directory

- 📖 **[`VIVA_GUIDE.md`](file:///c:/Users/ragha/swelab/VIVA_GUIDE.md)**: Dedicated viva defense script, examiner Q&A bank, and emergency live-coding cheat sheet.
- 📐 **[`docs/DECISIONS.md`](file:///c:/Users/ragha/swelab/docs/DECISIONS.md)**: Architectural decisions and requirement resolutions with formal rationale.
- 🎯 **[`docs/TRACEABILITY.md`](file:///c:/Users/ragha/swelab/docs/TRACEABILITY.md)**: Requirements Traceability Matrix linking FR-001 through FR-053 and BR-001 through BR-012 to code and tests.
- 🔌 **[`docs/API.md`](file:///c:/Users/ragha/swelab/docs/API.md)**: REST API specification with sample payloads and HTTP status codes.
- 🚀 **[`docs/DEPLOYMENT.md`](file:///c:/Users/ragha/swelab/docs/DEPLOYMENT.md)**: Local and cloud production deployment documentation.
