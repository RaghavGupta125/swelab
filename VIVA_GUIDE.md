# 🎓 HostGuard — Ultimate Viva Defense Guide & Examiner Q&A
**Institution:** The LNM Institute of Information Technology, Jaipur (LNMIIT)  
**Course:** CS314 — Software Development Laboratory  
**Team ID:** T049 (`T049(1).pdf`)  
**Product:** HostGuard — Enterprise Hostel Visitor Access Control System

---

## ⚡ 1. The 60-Second Elevator Pitch
> *"HostGuard is an institutional visitor entry and facility access management platform built for LNMIIT hostels. It digitizes the entire visitor lifecycle from unauthenticated kiosk pre-registration and host student approval to cryptographic single-use QR pass generation, optical camera gate scanning, real-time overstay detection, and warden disciplinary oversight.*
> *The entire system enforces 12 strict institutional business rules (BR-001 to BR-012) completely on the backend, ensuring that no visitor can enter without prior host clearance, hosts cannot exceed a concurrent 5-person quota, late same-day entries past 18:40 are rejected, and expired passes cannot be reused."*

---

## 🏛️ 2. Architectural Walkthrough (How to explain the stack)

```
[ Visitor / Kiosk ]        [ Student Portal ]       [ Guard Terminal ]     [ Warden / Admin ]
  (Self-Registration)       (Approve/Reject)         (Optical Scanner)      (Live Monitoring)
          \                        |                         |                      /
           \                       |                         |                     /
            +----------------------+-------------------------+--------------------+
                                           |
                                [ React + Vite + Tailwind ]
                                  (Client Presentation)
                                           |
                                    REST API / JWT
                                           |
                              [ Express.js / Node.js ]
                         +-----------------------------------+
                         | • Auth & Role Middleware          |
                         | • Business Rules Validator (BRs)  |
                         | • Background Scheduler (30s Cron) |
                         +-----------------------------------+
                                           |
                                [ MongoDB / Mongoose ]
                          (12 Collections: Requests, Passes,
                           Visits, Guards, Wardens, Logs)
```

### Key Technical Decisions (Why did you choose this?):
1. **Why MongoDB?**
   - Visitor requests have flexible structures (accompanying guests array, optional identification types, nested visitor profiles).
   - Fast document lookups by indexed `token`, `requestId`, or `hostStudentRollNumber`.
2. **Why JWT in HTTP-Only / Bearer format?**
   - Stateless authentication allows guards to operate on low-latency mobile devices at the hostel gates without keeping heavy session state on the server.
3. **Why Single-Use Cryptographic QR Pass?**
   - Avoids pass-sharing or re-entry fraud. A QR pass payload contains `{ passId, token, requestId, hostelId, type }`. The token is validated against MongoDB and permanently consumed (`PASS_STATUS.CONSUMED`) on check-in.
4. **Why Server-Side Clock with Controlled Time (`timeUtils.js`)?**
   - Guards or visitors cannot bypass visiting hours (06:00 - 19:00) by altering their device time. The backend enforces Asia/Kolkata (IST) time for all validations.

---

## 📋 3. Business Rules Cheat Sheet (Where are they implemented?)

If the examiner points to any rule in the project spec, open the file listed below:

| Rule | Requirement | Code File | Key Function |
|---|---|---|---|
| **BR-001** | Max 5 concurrent active visitors per student host | `backend/src/services/visitRequestService.js` | `getActiveVisitorCountForHost()` |
| **BR-002** | Disciplinary suspension blocks hosting privileges | `backend/src/services/visitRequestService.js` | `accountStatus !== USER_STATUS.ACTIVE` check |
| **BR-003** | Self-hosting prohibition (host cannot host self) | `backend/src/services/visitRequestService.js` | `hostUser.phoneNumber === visitorPhone` check |
| **BR-004** | Visiting window: Strictly 06:00 to 19:00 IST | `backend/src/utils/timeUtils.js` | `isWithinVisitingHours(timeStr)` |
| **BR-005** | Same-day late cutoff: No new entries past 18:40 | `backend/src/utils/timeUtils.js` | `isPastLateApprovalCutoff()` |
| **BR-006** | 20-minute approval timeout on pending requests | `backend/src/jobs/scheduler.js` & `timeUtils.js` | `isRequestExpiredByTimeout()` |
| **BR-007** | Mandatory prior host approval before gate entry | `backend/src/services/gateService.js` | `verifyGatePass()` (`requestStatus === APPROVED`) |
| **BR-008** | Single pass execution (Pass invalidates on exit) | `backend/src/services/gateService.js` | `recordGateEntry()` & `recordGateExit()` |
| **BR-009** | Sequential gate state (Checkout requires entry) | `backend/src/services/gateService.js` | `recordGateExit()` checks `entryTime !== null` |
| **BR-010** | Dynamic overstay calculation (flags past 19:00) | `backend/src/services/overstayService.js` | `computeOverstay()` & `scanActiveOverstays()` |
| **BR-011** | Guard active duty shift required for gate ops | `backend/src/services/gateService.js` | `hasActiveGuardShift(guardId)` |
| **BR-012** | Hostel Room Containment (host in assigned room) | `backend/src/services/visitRequestService.js` | `targetHostel !== studentProfile.hostelId` |

---

## 🛠️ 4. On-The-Spot Modification Guide (If Examiner asks you to change code)

### Task A: "Change the concurrent visitor quota from 5 to 3"
1. Open [`backend/src/config/constants.js`](file:///c:/Users/ragha/swelab/backend/src/config/constants.js).
2. Change:
   ```javascript
   HOST_MAX_CONCURRENT_VISITORS: 3,
   REQUEST_MAX_VISITORS: 3,
   ```
3. Save. Done!

### Task B: "Change gate visiting hours to end at 8:00 PM (20:00) instead of 7:00 PM"
1. Open [`backend/src/config/constants.js`](file:///c:/Users/ragha/swelab/backend/src/config/constants.js).
2. Change:
   ```javascript
   VISITING_END_HOUR: '20:00',
   SAME_DAY_CUTOFF_HOUR: '19:40',
   ```
3. In [`backend/src/utils/timeUtils.js`](file:///c:/Users/ragha/swelab/backend/src/utils/timeUtils.js), update the minute check `endMinutes = 20 * 60;`.
4. Save. Done!

### Task C: "Add vehicle registration number to visitor requests"
1. **Backend Model:** [`backend/src/models/VisitRequest.js`](file:///c:/Users/ragha/swelab/backend/src/models/VisitRequest.js) already has `vehicleNumber: { type: String, trim: true }` pre-configured under `visitor`!
2. **Backend Service:** [`backend/src/services/visitRequestService.js`](file:///c:/Users/ragha/swelab/backend/src/services/visitRequestService.js) already maps `vehicleNumber: requestData.vehicleNumber`.
3. **Frontend Input:** In [`frontend/src/pages/visitor/VisitorKiosk.jsx`](file:///c:/Users/ragha/swelab/frontend/src/pages/visitor/VisitorKiosk.jsx), add:
   ```jsx
   <input
     type="text"
     placeholder="e.g. RJ-14-EA-1234"
     value={formData.vehicleNumber}
     onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
     className="form-input text-xs font-mono"
   />
   ```
4. Save. Run `npm run build` in frontend.

### Task D: "Add a new hostel (e.g. BH6)"
1. Open [`backend/src/config/constants.js`](file:///c:/Users/ragha/swelab/backend/src/config/constants.js).
2. Add `{ id: 'BH6', name: 'Boys Hostel 6', type: 'BOYS' }` to `HOSTEL_LIST`.
3. In [`frontend/src/pages/visitor/VisitorKiosk.jsx`](file:///c:/Users/ragha/swelab/frontend/src/pages/visitor/VisitorKiosk.jsx) and `WardenConsole.jsx`, add `<option value="BH6">BH6 (Boys Hostel 6)</option>`.

---

## 💬 5. Top 15 Viva Questions & Bulletproof Answers

#### Q1: How do you prevent a visitor from entering with a screenshot of someone else's QR code?
> **Answer:** *"The QR pass contains an encrypted, unique token (`TKN-...`) tied to a specific `requestId`. When the guard scans it, the backend verifies that the request is `APPROVED`, matching physical government ID is displayed on the guard's Clearance Dossier for manual inspection, and upon check-in, the pass status is transitioned to `IN_USE` and then `CONSUMED`. Re-using the same QR code immediately triggers a `Pass already consumed` error (BR-008)."*

#### Q2: How is the 20-minute approval timeout handled if no one is looking at the screen?
> **Answer:** *"We implement a dual-layer strategy:
> 1. An automated background job (`scheduler.js`) runs every 30 seconds on the server. It scans all `PENDING` requests where `(now - createdAt) > 20 minutes` and marks them `EXPIRED` (BR-006).
> 2. On the student frontend, a live reactive countdown timer counts down from 20 minutes and disables the approval action when time expires."*

#### Q3: What happens if a student tries to approve 6 visitors at the same time?
> **Answer:** *"Rule BR-001 enforces a maximum host concurrent quota of 5 visitors. This is checked at two stages:
> 1. At request submission/approval time in `visitRequestService.js`.
> 2. At physical gate entry in `gateService.js`. The query sums all active `VisitRecord` documents where `exitTime === null` for that host's roll number. If `activeCount + newCount > 5`, check-in is rejected."*

#### Q4: How is an overstay detected?
> **Answer:** *"An overstay occurs when an inside visitor exceeds either their expected exit timestamp OR the hostel 19:00 IST visiting cutoff. The background cron detects this, creates an `OverstayAlert` document with severity `CRITICAL`, alerts the warden console with a blinking visual advisory banner, and logs a violation record into the immutable audit trail."*

#### Q5: What if the gate camera is damaged or offline?
> **Answer:** *"We built an automatic manual token fallback (FR-037). If camera hardware is inaccessible, the guard simply types the unguessable alphanumeric pass token (e.g. `TKN-A45X9`) or the visitor's registered phone number directly into the terminal lookup bar."*

#### Q6: Why can't a guard edit visitor logs?
> **Answer:** *"Gate records (`VisitRecord`) and system events (`AuditLog`) are append-only. Gate guards only have permissions to record timestamps (`checkInVisitor`, `checkOutVisitor`). No endpoint exists for editing or deleting historical entries, satisfying Non-Functional Requirement NFR-020 (Forensic Audit Trail)."*

#### Q7: How are service workers (plumbers, electricians) tracked differently from visitors?
> **Answer:** *"Visitors require student host approval and single-use QR passes. Service workers are pre-registered staff categorized as `PERMANENT`, `CONTRACT`, or `DAILY` with an assigned trade and authorized hostel. The guard console has a dedicated 'Staff' tab where guards log worker entry and exit with a single click, verifying that the worker is authorized for that specific hostel (FR-047, FR-048)."*

#### Q8: How does the warden manage student discipline?
> **Answer:** *"Under the 'Discipline & Status' tab in `WardenConsole.jsx`, the warden can look up any student roll number and toggle their status to `ACTIVE`, `SUSPENDED`, or `BLOCKED`. If a student is suspended, BR-002 immediately blocks them from receiving, creating, or approving any visitor passes."*

---

## 🎬 6. Live Viva Demonstration Script (Follow this step-by-step!)

Open your browser at `http://localhost:5000`:

1. **Step 1: Show the Visitor Kiosk (`/visitor`)**
   - Click *"GUEST OR VISITOR SELF-REGISTRATION KIOSK"*.
   - Fill in:
     - Name: `Ramesh Kumar`, Phone: `9829012345`, ID: `Aadhaar Card` (`1234-5678-9012`).
     - Host Roll: `24UCS049`, Hostel: `BH1`, Room: `B-201`.
     - Schedule: Today's date, `16:00` to `18:00`.
   - Click *"Submit Clearance Application"*.
   - Note the generated Request ID (e.g., `VR...`). Explain: *"Notice it is now in PENDING status. The visitor cannot enter yet."*

2. **Step 2: Show the Student Portal (`/student`)**
   - Go to `/login` and click the **Host Student** quick-fill button (`24ucs049@lnmiit.ac.in`).
   - Click *"Authorize Session"*.
   - Show the **5-dot quota gauge** (Quota Usage: 1/5).
   - Show the newly arrived request with the **20-minute countdown timer**.
   - Click **"Approve & Issue Pass"**.
   - Explain: *"The student has authorized the visit. A dynamic QR code pass is now generated on the server."*

3. **Step 3: Show the Digital Pass View**
   - In the student portal, click *"View Digital QR Pass"*.
   - Show the high-contrast single-entry pass with token (e.g., `TKN-...`).
   - Copy the token or show the QR code.

4. **Step 4: Show the Security Guard Gate Console (`/guard`)**
   - Click Sign Out and log in using the **Gate Guard** quick-fill button (`guard1@lnmiit.ac.in`).
   - Show the terminal with the **glowing green LED shift indicator**.
   - Paste the token into the manual lookup bar (or launch the scanner).
   - Click *"Execute Pass Lookup"*.
   - Show the **Clearance Dossier**: Show the visitor details, host roll, and room number.
   - Click **"Authorize Entry"**.
   - Show that the visitor is now in the **Inside Visitors log** with entry timestamp!

5. **Step 5: Show the Hostel Warden Console (`/warden`)**
   - Sign Out and log in using the **Hostel Warden** quick-fill button (`warden.bh1@lnmiit.ac.in`).
   - Show the live occupancy metrics (`Currently Inside: 2`).
   - Show the **Critical Overstay Incident Banner** (pointing out Prakash Chandra who exceeded the cutoff time).
   - Click *"Acknowledge"* and demonstrate entering disciplinary notes.
   - Click *"Staff Registry"* and show registered workers.
   - Click *"Daily Analytics"* and show report generation.

6. **Step 6: Show Automated Tests**
   - Open terminal and run: `npm test`
   - Point out that all **25/25 automated unit and integration tests** pass, proving all 12 business rules are programmatically verified.
