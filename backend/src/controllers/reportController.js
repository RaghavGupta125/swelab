import { queryHistoricalVisits, generateDailyTrafficReport } from '../services/reportService.js';

export const getHistoricalVisits = async (req, res, next) => {
  try {
    const { hostelId, studentRollNumber, visitorName, guardId, startDate, endDate, overstayOnly, page, limit } = req.query;
    const targetHostel = req.wardenProfile ? req.wardenProfile.assignedHostelId : hostelId;

    const result = await queryHistoricalVisits({
      hostelId: targetHostel,
      studentRollNumber,
      visitorName,
      guardId,
      startDate,
      endDate,
      overstayOnly,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getDailyReport = async (req, res, next) => {
  try {
    const { hostelId, date } = req.query;
    const targetHostel = req.wardenProfile ? req.wardenProfile.assignedHostelId : hostelId;
    const report = await generateDailyTrafficReport(targetHostel, date);

    return res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    next(error);
  }
};
