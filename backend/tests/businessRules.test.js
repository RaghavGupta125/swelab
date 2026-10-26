import {
  isWithinVisitingHours,
  isPastLateApprovalCutoff,
  isRequestExpiredByTimeout,
  computeOverstay,
  setMockTime
} from '../src/utils/timeUtils.js';
import { BUSINESS_RULES } from '../src/config/constants.js';

describe('HostGuard Business Rules Validation (BR-001 through BR-012)', () => {
  afterEach(() => {
    setMockTime(null);
  });

  describe('BR-004: Official Visiting Window (06:00 to 19:00)', () => {
    test('allows timestamps strictly within 06:00 and 19:00', () => {
      expect(isWithinVisitingHours('06:00')).toBe(true);
      expect(isWithinVisitingHours('12:30')).toBe(true);
      expect(isWithinVisitingHours('18:40')).toBe(true);
      expect(isWithinVisitingHours('19:00')).toBe(true);
    });

    test('rejects timestamps before 06:00 or after 19:00', () => {
      expect(isWithinVisitingHours('05:59')).toBe(false);
      expect(isWithinVisitingHours('00:00')).toBe(false);
      expect(isWithinVisitingHours('19:01')).toBe(false);
      expect(isWithinVisitingHours('21:30')).toBe(false);
      expect(isWithinVisitingHours(null)).toBe(false);
    });
  });

  describe('BR-005: Same-Day Late Approval Cutoff (18:40)', () => {
    test('allows requests prior to or at 18:40 IST', () => {
      const allowedTime = new Date('2026-10-26T18:30:00+05:30');
      expect(isPastLateApprovalCutoff(allowedTime)).toBe(false);

      const exactCutoff = new Date('2026-10-26T18:40:00+05:30');
      expect(isPastLateApprovalCutoff(exactCutoff)).toBe(false);
    });

    test('flags requests after 18:40 IST as past cutoff', () => {
      const lateTime = new Date('2026-10-26T18:41:00+05:30');
      expect(isPastLateApprovalCutoff(lateTime)).toBe(true);

      const nightTime = new Date('2026-10-26T19:15:00+05:30');
      expect(isPastLateApprovalCutoff(nightTime)).toBe(true);
    });
  });

  describe('BR-006: 20-Minute Approval Window Timeout', () => {
    test('identifies requests under 20 minutes as unexpired', () => {
      setMockTime('2026-10-26T12:15:00+05:30');
      const createdAt = new Date('2026-10-26T12:00:00+05:30'); // 15 mins ago
      expect(isRequestExpiredByTimeout(createdAt, 20)).toBe(false);
    });

    test('identifies requests older than 20 minutes as expired', () => {
      setMockTime('2026-10-26T12:25:00+05:30');
      const createdAt = new Date('2026-10-26T12:00:00+05:30'); // 25 mins ago
      expect(isRequestExpiredByTimeout(createdAt, 20)).toBe(true);
    });
  });

  describe('BR-010: Dynamic Overstay Calculation', () => {
    test('returns false if current time is before expectedExitTime and before 19:00', () => {
      setMockTime('2026-10-26T16:30:00+05:30');
      const expectedExit = new Date('2026-10-26T17:00:00+05:30');
      expect(computeOverstay(expectedExit)).toBe(false);
    });

    test('returns true if current time exceeds expectedExitTime', () => {
      setMockTime('2026-10-26T17:05:00+05:30');
      const expectedExit = new Date('2026-10-26T17:00:00+05:30');
      expect(computeOverstay(expectedExit)).toBe(true);
    });

    test('returns true if time exceeds 19:00 even if expectedExit was 19:30', () => {
      setMockTime('2026-10-26T19:05:00+05:30');
      const expectedExit = new Date('2026-10-26T19:30:00+05:30');
      expect(computeOverstay(expectedExit)).toBe(true);
    });
  });
});
