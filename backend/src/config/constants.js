// =============================================================================
// HOSTGUARD SYSTEM CONSTANTS & BUSINESS RULES
// LNMIIT CS314 Team T049 (Authoritative Source: T049(1).pdf)
//
// 💡 VIVA CHEAT CODE: If the examiner asks you to modify any institutional rule
// (e.g., change quota, shift gate hours, adjust approval timeouts), THIS is the
// single file you edit!
// =============================================================================

// System Roles as defined in T049(1).pdf
export const ROLES = Object.freeze({
  STUDENT: 'STUDENT',
  GUARD: 'GUARD',
  WARDEN: 'WARDEN',
  ADMIN: 'ADMIN',
  WORKER: 'WORKER'
});

// User Account Status
export const USER_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  BLOCKED: 'BLOCKED'
});

// Visit Request Status Lifecycle (FR-018, Page 15, Page 52)
export const REQUEST_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED'
});

// QR Pass Status (Page 54)
export const PASS_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  IN_USE: 'IN_USE',
  CONSUMED: 'CONSUMED',
  EXPIRED: 'EXPIRED',
  INVALIDATED: 'INVALIDATED'
});

// Worker Types (FR-047, Decision 2.1)
export const WORKER_TYPES = Object.freeze({
  PERMANENT: 'PERMANENT',
  CONTRACT: 'CONTRACT',
  DAILY: 'DAILY'
});

// Identification Types for visitors
export const ID_TYPES = Object.freeze({
  AADHAAR: 'Aadhaar Card',
  DRIVING_LICENSE: 'Driving License',
  PASSPORT: 'Passport',
  VOTER_ID: 'Voter ID',
  COLLEGE_ID: 'College ID',
  GOVT_ID: 'Government ID'
});

// Business Rules Constants (BR-001 through BR-012)
export const BUSINESS_RULES = Object.freeze({
  HOST_MAX_CONCURRENT_VISITORS: 5,   // BR-001
  REQUEST_MAX_VISITORS: 5,           // FR-011
  VISITING_START_HOUR: '06:00',      // BR-004
  VISITING_END_HOUR: '19:00',        // BR-004
  SAME_DAY_CUTOFF_HOUR: '18:40',     // BR-005
  APPROVAL_TIMEOUT_MINUTES: 20,      // BR-006
  TIMEZONE: 'Asia/Kolkata'
});

// Hostel Identifiers supported at LNMIIT
export const HOSTEL_LIST = Object.freeze([
  { id: 'BH1', name: 'Boys Hostel 1', type: 'BOYS' },
  { id: 'BH2', name: 'Boys Hostel 2', type: 'BOYS' },
  { id: 'BH3', name: 'Boys Hostel 3', type: 'BOYS' },
  { id: 'BH4', name: 'Boys Hostel 4', type: 'BOYS' },
  { id: 'BH5', name: 'Boys Hostel 5', type: 'BOYS' },
  { id: 'GH',  name: 'Girls Hostel',  type: 'GIRLS' }
]);
