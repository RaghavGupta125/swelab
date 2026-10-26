# HostGuard — Architectural & Business Rules Decisions Log (docs/DECISIONS.md)

**Project:** HostGuard — Visitor Entry Management System  
**Institution:** The LNM Institute of Information Technology, Jaipur (LNMIIT)  
**Course:** CS314 Software Development Laboratory  
**Team ID:** T049  
**Date:** October 2026  

---

## 1. Purpose
This document records all architectural decisions, interpretations of source specifications (`T049(1).pdf`), resolutions of ambiguities or inconsistencies found in the project requirements, and their exact impacts on the codebase.

---

## 2. Inconsistencies Identified & Resolved

### Decision 2.1: Worker Categories and Status Enumerations
- **Source Ambiguity:** Page 9 (FR-047) lists `WorkerType` as `PERMANENT`, `CONTRACT`, `DAILY`. Page 15 lists `WorkerType` as `PERMANENT`, `CONTRACT`. Page 4 lists housekeeping, maintenance and contract-based staff.
- **Resolution:** We standardize `WorkerType` across the system to include:
  - `PERMANENT` (regular campus maintenance / staff)
  - `CONTRACT` (contractual housekeeping / mess / security)
  - `DAILY` (ad-hoc daily maintenance labor)
- **Impact:** The `Worker` schema and UI filters support all three types, with role verification before gate entry logging (FR-048).

### Decision 2.2: Visitor Registration vs Institutional Authentication
- **Source Ambiguity:** Lab 2 mentions User hierarchy where Visitor inherits from User, while also allowing external visitors to self-register at gate without full college LDAP/institutional credentials.
- **Resolution:** 
  - Institutional users (`STUDENT`, `GUARD`, `WARDEN`, `ADMIN`) authenticate via secure institutional email / roll number and hashed password sessions.
  - External visitors can create a `VisitRequest` either through:
    1. Pre-registration initiated by a student (FR-008).
    2. Self-registration kiosk portal (FR-009) providing Name, Phone Number, Govt ID Type, Govt ID Number, Target Hostel, and Host Student Roll Number.
  - Visitors access their approved QR pass and status using a secure, unguessable Request Reference ID / Access Token sent via notification/link, preventing unauthorized disclosure of student or visitor records.
- **Impact:** Preserves privacy (NFR-019), complies with FR-009 and FR-028, and eliminates complex external account setup while maintaining strict security.

### Decision 2.3: Host Simultaneous Visitor Quota vs Request Guest Quota
- **Source Ambiguity:** FR-011 allows up to 5 visitors under a single VisitRequest (1 primary visitor + up to 4 accompanying guests = 5 total). BR-001 specifies that a host student can have at most 5 active, checked-in visitors inside the hostel simultaneously.
- **Resolution:**
  - `VisitRequest.totalVisitorCount` = 1 (primary) + accompanying guests count (maximum 5 total per request).
  - `Host Concurrent Quota (BR-001)`: When approving a request or checking in visitors at the gate, the system computes the sum of all currently checked-in visitors (primary + accompanying) for that host student. If `currentlyCheckedIn + requestVisitorCount > 5`, approval or check-in is blocked.
- **Impact:** Prevents a student from hosting more than 5 individuals concurrently, satisfying both the request limit and hostel occupancy policy.

### Decision 2.4: Exact Visiting Hours & Late Approval Cutoffs
- **Source Specification:**
  - Visiting window: `06:00 to 19:00` (6:00 AM to 7:00 PM) (BR-004, FR-014).
  - Late approval/initiation cutoff: `18:40` (6:40 PM) for same-day entry (BR-005).
  - Approval timeout: 20 minutes from request submission (BR-006).
  - Timezone: `Asia/Kolkata` (IST, UTC+5:30).
- **Resolution:** 
  - Every scheduled entry and exit time must fall strictly between 06:00 and 19:00 IST.
  - Same-day visit requests cannot be created or approved after 18:40 IST.
  - Any pending request whose `createdAt + 20 minutes < currentTime` or `currentTime > expectedEntryTime` automatically transitions to `EXPIRED`.
- **Impact:** Strictly enforced in `visitRequestService` and in automated background cron jobs.

### Decision 2.5: QR Pass Structure and Replay Prevention
- **Source Specification:** FR-027, FR-031, BR-007, BR-008.
- **Resolution:**
  - QR codes contain an encrypted/signed JSON or random cryptographic token (`TKN-...`) resolved exclusively server-side.
  - It does NOT expose raw government ID or sensitive personal data in the QR plain text.
  - Pass states: `ACTIVE` -> `IN_USE` (checked-in) -> `INVALIDATED` / `CONSUMED` (checked-out).
  - BR-008 is enforced: a pass permits exactly 1 check-in. Once checked out, the pass is permanently invalidated and re-entry is blocked.
- **Impact:** High security, zero replay attack vulnerability, complies with NFR-006 and NFR-019.

### Decision 2.6: Overstay Detection and Incident Logging
- **Source Specification:** FR-038 to FR-042, BR-010.
- **Resolution:**
  - An active visit is an overstay if `currentTime > expectedExitTime` OR `currentTime > 19:00` (hostel closing boundary).
  - The system dynamically evaluates overstay on dashboard queries AND via a background task that generates persistent `OverstayAlert` records, updates `VisitRecord.overstayStatus = true`, and dispatches in-app and email notifications without duplicating alerts for the same visit.
- **Impact:** Wardens and guards receive immediate visual red alerts and permanent audit records for discipline management.

### Decision 2.7: Guard Shift Attendance Requirement
- **Source Specification:** BR-011, FR-043, FR-044, FR-045.
- **Resolution:**
  - Guards must mark duty check-in (`GuardAttendance.checkIn`) at their assigned hostel before recording any visitor entry or exit.
  - If a guard attempts gate check-in/out without an active shift today, the API responds with `403 Forbidden` ("Active guard shift check-in required on current date").
- **Impact:** Guarantees accountability for gate logs and fulfills BR-011.

---
