# HostGuard — Requirements Traceability Matrix (RTM)

| Req ID | Category | Description | Primary Actor | Target Module / Service | Test Reference |
|---|---|---|---|---|---|
| **FR-001** | Auth | Authenticate registered users (Student, Guard, Warden, Admin) | All Users | `backend/src/controllers/authController.js` | `auth.test.js` |
| **FR-002** | Auth | Failure handling without leaking email vs password | All Users | `backend/src/services/authService.js` | `auth.test.js` |
| **FR-003** | Auth | Session / token termination upon logout | All Users | `backend/src/controllers/authController.js` | `auth.test.js` |
| **FR-004** | RBAC | Admin role assignment | Admin | `backend/src/controllers/adminController.js` | `admin.test.js` |
| **FR-005** | RBAC | Enforce role-based access control across views and APIs | All Users | `backend/src/middleware/authMiddleware.js` | `rbac.test.js` |
| **FR-006** | RBAC | User status management (ACTIVE, INACTIVE, BLOCKED) | Admin / Warden | `backend/src/controllers/adminController.js` | `admin.test.js` |
| **FR-007** | RBAC | Immediate denial of auth for BLOCKED / INACTIVE users | System | `backend/src/middleware/authMiddleware.js` | `auth.test.js` |
| **FR-008** | Request | Student pre-registration for anticipated guests | Student | `backend/src/controllers/visitRequestController.js` | `visitRequest.test.js` |
| **FR-009** | Request | Visitor self-registration at hostel gate portal | Visitor | `backend/src/controllers/visitRequestController.js` | `visitor.test.js` |
| **FR-010** | Request | Capture visitor name, phone, idType, idNumber | Visitor / Student | `backend/src/models/VisitRequest.js` | `visitRequest.test.js` |
| **FR-011** | Quota | Support up to 5 total visitors with accompanying guests | Visitor / Student | `backend/src/services/visitRequestService.js` | `quota.test.js` |
| **FR-012** | Request | Host association (studentId, roomNumber, hostelId) | System | `backend/src/services/visitRequestService.js` | `visitRequest.test.js` |
| **FR-013** | Schedule| Capture visitDate, expectedEntryTime, expectedExitTime, purpose | Visitor / Student | `backend/src/models/VisitRequest.js` | `visitRequest.test.js` |
| **FR-014** | Window | Enforce 06:00 to 19:00 official visiting hours | System | `backend/src/utils/timeUtils.js` | `businessRules.test.js` |
| **FR-015** | Request | Save incomplete visit request as draft | Student / Visitor | `backend/src/controllers/visitRequestController.js` | `visitRequest.test.js` |
| **FR-016** | Request | Modify request details while status is PENDING | Initiator | `backend/src/services/visitRequestService.js` | `visitRequest.test.js` |
| **FR-017** | Request | Cancel visit request prior to entry | Initiator / Host | `backend/src/services/visitRequestService.js` | `visitRequest.test.js` |
| **FR-018** | Request | Track real-time status (PENDING, APPROVED, REJECTED, EXPIRED, CANCELLED) | Visitor / Student | `backend/src/controllers/visitRequestController.js` | `visitRequest.test.js` |
| **FR-019** | Expiry | Automated request expiry if entry elapsed or 20m unapproved | System | `backend/src/jobs/expirationJob.js` | `expiration.test.js` |
| **FR-020** | Approval| Host student pending request dashboard feed | Student | `backend/src/controllers/studentController.js` | `approval.test.js` |
| **FR-021** | Approval| Inspect visitor credentials and accompanying guest details | Student | `backend/src/controllers/studentController.js` | `approval.test.js` |
| **FR-022** | Approval| Host student approve request | Student | `backend/src/services/visitRequestService.js` | `approval.test.js` |
| **FR-023** | Approval| Record exact approvedAt timestamp | System | `backend/src/models/VisitRequest.js` | `approval.test.js` |
| **FR-024** | Approval| Host student reject request | Student | `backend/src/services/visitRequestService.js` | `approval.test.js` |
| **FR-025** | Approval| Optional rejection reason capture | Student | `backend/src/models/VisitRequest.js` | `approval.test.js` |
| **FR-026** | History | Student visit history filtered by approval status | Student | `backend/src/controllers/studentController.js` | `approval.test.js` |
| **FR-027** | QR Pass | Dynamic secure time-bound QR code on approval | System | `backend/src/services/qrPassService.js` | `qrPass.test.js` |
| **FR-028** | QR Pass | Digital pass retrieval for student and visitor | Student / Visitor | `backend/src/controllers/qrPassController.js` | `qrPass.test.js` |
| **FR-029** | Gate | Visitor verification lookup by ID, phone, or roll number | Guard | `backend/src/controllers/gateController.js` | `gate.test.js` |
| **FR-030** | Gate | QR code scanning via camera interface | Guard | `frontend/src/components/QRScannerModal.jsx` | `e2e.test.js` |
| **FR-031** | Gate | Pass validity enforcement (APPROVED state & time window) | Guard / System | `backend/src/services/gateService.js` | `gate.test.js` |
| **FR-032** | Gate | Gate entry check-in creates VisitRecord | Guard | `backend/src/services/gateService.js` | `gate.test.js` |
| **FR-033** | Gate | Entry timestamp logging and guard on duty link | System | `backend/src/models/VisitRecord.js` | `gate.test.js` |
| **FR-034** | Gate | Duplicate entry prevention (block if already active) | Guard / System | `backend/src/services/gateService.js` | `gate.test.js` |
| **FR-035** | Gate | Gate exit recording | Guard | `backend/src/services/gateService.js` | `gate.test.js` |
| **FR-036** | Gate | Exit timestamp logging and session closure | System | `backend/src/services/gateService.js` | `gate.test.js` |
| **FR-037** | Gate | Manual entry fallback without camera | Guard | `frontend/src/pages/guard/GateConsole.jsx` | `gate.test.js` |
| **FR-038** | Overstay| Automated overstay calculation | System | `backend/src/services/overstayService.js` | `overstay.test.js` |
| **FR-039** | Overstay| Live overstay monitoring on Warden dashboard | Warden | `backend/src/controllers/wardenController.js` | `warden.test.js` |
| **FR-040** | Overstay| Overstay visual red highlighting | UI | `frontend/src/components/OverstayBadge.jsx` | `ui.test.js` |
| **FR-041** | Overstay| Automated alert dispatch to host student and gate guard | System | `backend/src/services/notificationService.js` | `overstay.test.js` |
| **FR-042** | Overstay| Permanent overstayStatus=true flag on VisitRecord | System | `backend/src/models/VisitRecord.js` | `overstay.test.js` |
| **FR-043** | Guard | Guard shift check-in | Guard | `backend/src/controllers/guardAttendanceController.js`| `attendance.test.js` |
| **FR-044** | Guard | Guard shift check-out | Guard | `backend/src/controllers/guardAttendanceController.js`| `attendance.test.js` |
| **FR-045** | Guard | Guard duty association with date, shift, hostel facility | System | `backend/src/models/GuardAttendance.js` | `attendance.test.js` |
| **FR-046** | Guard | Warden defines and assigns shifts to guards | Warden | `backend/src/controllers/wardenController.js` | `warden.test.js` |
| **FR-047** | Worker | Daily worker entry/exit logging by type (PERMANENT, CONTRACT, DAILY) | Guard | `backend/src/controllers/workerController.js` | `worker.test.js` |
| **FR-048** | Worker | Daily worker facility authorization check | Guard / System | `backend/src/services/workerService.js` | `worker.test.js` |
| **FR-049** | Report | Warden historical visit query across dates, roll no, etc. | Warden | `backend/src/controllers/wardenController.js` | `report.test.js` |
| **FR-050** | Report | Multi-criteria search filtering | Warden | `backend/src/controllers/wardenController.js` | `report.test.js` |
| **FR-051** | Report | Daily visitor traffic and security audit reports | Warden | `backend/src/controllers/reportController.js` | `report.test.js` |
| **FR-052** | Notif | In-app and email notifications upon lifecycle events | System | `backend/src/services/notificationService.js` | `notification.test.js` |
| **FR-053** | Notif | Notification acknowledgment (mark as read) & unread count | All Users | `backend/src/controllers/notificationController.js` | `notification.test.js` |

### Business Rules (BR-001 to BR-012)
- **BR-001**: Host Concurrent Quota (Max 5 active visitors simultaneously). Enforced in `visitRequestService.js` and `gateService.js`.
- **BR-002**: Host Disciplinary Suspension (BLOCKED or INACTIVE prohibited from approving). Enforced in `visitRequestService.js`.
- **BR-003**: Self-Hosting Prohibition (Host student cannot host themselves). Enforced in `visitRequestValidator.js`.
- **BR-004**: Official Visiting Window (06:00 to 19:00). Enforced in `timeUtils.js`.
- **BR-005**: Late Approval Cutoff (No same-day initiation/approval past 18:40). Enforced in `visitRequestService.js`.
- **BR-006**: Approval Window Timeout (20 min pending auto-expiry). Enforced in `expirationJob.js` & `visitRequestService.js`.
- **BR-007**: Mandatory Prior Approval (VisitRecord gate entry requires status APPROVED). Enforced in `gateService.js`.
- **BR-008**: Single Pass Execution (0..1 gate entry per VisitRequest; invalidated on checkout). Enforced in `gateService.js`.
- **BR-009**: Sequential Gate State (exitTime requires non-null entryTime). Enforced in `gateService.js`.
- **BR-010**: Overstay Calculation Threshold (exceeds expectedExitTime or 19:00). Enforced in `overstayService.js`.
- **BR-011**: Guard Active Shift Requirement (active checkIn today required for gate operations). Enforced in `gateService.js`.
- **BR-012**: Hostel Room Containment (host student only hosts in assigned hostel and room). Enforced in `visitRequestService.js`.
