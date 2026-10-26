import { VisitRecord } from '../models/VisitRecord.js';
import { VisitRequest } from '../models/VisitRequest.js';
import { OverstayAlert } from '../models/OverstayAlert.js';
import { getISTParts } from '../utils/timeUtils.js';

export const queryHistoricalVisits = async ({
  hostelId,
  studentRollNumber,
  visitorName,
  guardId,
  startDate,
  endDate,
  overstayOnly,
  limit = 100,
  page = 1
}) => {
  const query = {};

  if (hostelId) query.hostelId = hostelId;
  if (studentRollNumber) query.hostStudentRollNumber = new RegExp(studentRollNumber.trim(), 'i');
  if (visitorName) query.visitorName = new RegExp(visitorName.trim(), 'i');
  if (guardId) query.guardId = new RegExp(guardId.trim(), 'i');
  if (overstayOnly === 'true' || overstayOnly === true) query.overstayStatus = true;

  if (startDate || endDate) {
    query.entryTime = {};
    if (startDate) query.entryTime.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.entryTime.$lte = end;
    }
  }

  const skip = (Math.max(1, page) - 1) * limit;

  const [records, total] = await Promise.all([
    VisitRecord.find(query)
      .sort({ entryTime: -1 })
      .skip(skip)
      .limit(Number(limit)),
    VisitRecord.countDocuments(query)
  ]);

  return {
    records,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit)
    }
  };
};

export const generateDailyTrafficReport = async (hostelId = null, dateStr = null) => {
  const targetDate = dateStr || getISTParts().dateStr;
  
  // Create start and end of day in UTC/IST
  const startOfDay = new Date(`${targetDate}T00:00:00+05:30`);
  const endOfDay = new Date(`${targetDate}T23:59:59.999+05:30`);

  const visitQuery = {
    entryTime: { $gte: startOfDay, $lte: endOfDay }
  };
  if (hostelId) visitQuery.hostelId = hostelId;

  const records = await VisitRecord.find(visitQuery);

  const totalEntries = records.length;
  const totalVisitorsCount = records.reduce((sum, r) => sum + (r.totalVisitorCount || 1), 0);
  const totalExits = records.filter(r => r.exitTime !== null).length;
  const currentlyActive = records.filter(r => r.exitTime === null).length;
  const overstayCount = records.filter(r => r.overstayStatus === true).length;

  // Requests created on this date
  const reqQuery = { visitDate: targetDate };
  if (hostelId) reqQuery.hostelId = hostelId;
  const requests = await VisitRequest.find(reqQuery);

  const approvedRequests = requests.filter(r => r.requestStatus === 'APPROVED').length;
  const rejectedRequests = requests.filter(r => r.requestStatus === 'REJECTED').length;
  const expiredRequests = requests.filter(r => r.requestStatus === 'EXPIRED').length;
  const pendingRequests = requests.filter(r => r.requestStatus === 'PENDING').length;

  return {
    reportDate: targetDate,
    hostelId: hostelId || 'ALL_HOSTELS',
    generatedAt: new Date(),
    summary: {
      totalEntries,
      totalVisitorsCount,
      totalExits,
      currentlyActive,
      overstayCount,
      totalRequests: requests.length,
      approvedRequests,
      rejectedRequests,
      expiredRequests,
      pendingRequests
    },
    records
  };
};
