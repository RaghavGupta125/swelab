# HostGuard — Hostel Visitor Entry Management System

**Institution:** The LNM Institute of Information Technology, Jaipur (LNMIIT)  
**Course:** CS314 — Software Development Laboratory  
**Team ID:** T049  
**Team Members:**
- Malapati Charith (24UCS049) — Project & Requirements Lead
- Atharva Sharma (24UCS050) — System Architecture & Design Lead
- Raghav Gupta (24UCS051) — Full-Stack Development Lead
- Rudraksh Tank (24UCS052) — Quality Assurance & Testing Lead

---

## 1. System Overview

HostGuard is a centralized, secure, role-based visitor access control platform purpose-built for university hostel facilities. It replaces manual paper logbooks and unverified entries with an end-to-end digital lifecycle: from visitor request creation and host student approval to dynamic QR pass verification, gate timestamp logging, dynamic overstay monitoring, and warden reporting.

### Core Architectural Highlights
- **Purpose-Built Security Console:** High-speed gate clearance terminal designed for smartphones, tablets, and gate desks.
- **Dynamic QR Code Pass System:** Time-bound, unguessable cryptographic tokens validated exclusively server-side.
- **Automated Business Rules Enforcement:**
  - `BR-001`: Host student concurrent visitor quota (max 5 active visitors simultaneously).
  - `BR-002`: Disciplinary suspension (blocked/inactive students cannot approve visits).
  - `BR-003`: Self-hosting prohibition.
  - `BR-004`: Official visiting window strictly restricted between 06:00 and 19:00 IST.
  - `BR-005`: Late approval cutoff: no same-day requests after 18:40 IST.
  - `BR-006`: 20-minute approval window timeout for pending requests.
  - `BR-007`: Mandatory prior host approval before gate entry instantiation.
  - `BR-008`: Single pass execution (0..1 entry; permanently invalidated upon checkout).
  - `BR-009`: Sequential gate state (checkout strictly requires prior non-null entry).
  - `BR-010`: Dynamic overstay calculation (flags violations past expected exit or 19:00).
  - `BR-011`: Guard active shift requirement (duty attendance required before gate logging).
  - `BR-012`: Hostel Room Containment (host student hosts only in assigned block & room).
- **Service Staff Entry/Exit:** Maintenance and housekeeping tracking categorized by `PERMANENT`, `CONTRACT`, and `DAILY` with facility authorization validation.

---

## 2. Technology Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, `html5-qrcode` camera scanner.
- **Backend:** Node.js, Express, Mongoose ODM, JWT, HTTP-Only Cookie session management, Rate limiting, Helmet security headers.
- **Database:** MongoDB.
- **Testing:** Jest, Supertest, cross-env with controlled clocks.

---

## 3. Demonstration & Quick Start

### 1. Install & Seed
```bash
# In backend
cd backend
npm install
npm run seed

# In frontend
cd ../frontend
npm install
npm run build

# Start Full Stack from root
cd ..
npm start
```
Navigate to: **`http://localhost:5000`**

### 2. Demo Credentials (Password: `Password@123`)

| Role | User Identifier | Key Responsibilities & View |
|---|---|---|
| **Gate Security Guard** | `guard1@lnmiit.ac.in` (or ID: `G012`) | Gate Scanner terminal, shift clock-in/out, verify QR passes, log visitor & worker check-in/out. |
| **Host Student** | `24ucs049@lnmiit.ac.in` (Roll: `24UCS049`) | Pending approvals with 20m countdown, quota meter (up to 5), pre-register visitors, history. |
| **Hostel Warden** | `warden.bh1@lnmiit.ac.in` | Live hostel occupancy, visual red overstay alerts, daily reports, student disciplinary block. |
| **System Administrator**| `admin@lnmiit.ac.in` | User directory, role assignment, account status (Active/Blocked), system audit logs. |
| **External Visitor** | *No login needed* | Visit Kiosk at `/visitor` for self-registration and tracking approved QR pass. |

---

## 4. Documentation Directory

- **`docs/DECISIONS.md`**: Architectural decisions, requirement resolutions, and rationale.
- **`docs/TRACEABILITY.md`**: Requirements Traceability Matrix (RTM) linking FR-001 through FR-053 and BR-001 through BR-012.
- **`docs/API.md`**: Detailed REST API documentation.
- **`docs/DEPLOYMENT.md`**: Local and production deployment guide.

---

## 5. Automated Tests

Run the complete test suite:
```bash
npm test
```
All 25 unit and API integration test suites pass, verifying authentication, RBAC, business rules boundaries, gate operations, duplicate check-in blocking, single pass reuse prevention, worker facility authorization, and overstay calculation.
