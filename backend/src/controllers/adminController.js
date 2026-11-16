import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { GuardProfile } from '../models/GuardProfile.js';
import { WardenProfile } from '../models/WardenProfile.js';
import { Hostel } from '../models/Hostel.js';
import { VisitRecord } from '../models/VisitRecord.js';
import { AuditLog } from '../models/AuditLog.js';
import { ROLES, USER_STATUS } from '../config/constants.js';
import { isStudentDirectoryConfigured, syncStudentDirectory } from '../services/studentDirectoryService.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const { role, status, search, limit = 100, page = 1 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (status) query.accountStatus = status;
    if (search) {
      query.$or = [
        { name: new RegExp(search.trim(), 'i') },
        { email: new RegExp(search.trim(), 'i') },
        { userId: new RegExp(search.trim(), 'i') }
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!Object.values(USER_STATUS).includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid account status.' });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const previousStatus = user.accountStatus;
    user.accountStatus = status;
    await user.save();

    await AuditLog.create({
      action: 'ADMIN_UPDATE_USER_STATUS',
      performedBy: { userId: req.user.userId, name: req.user.name, role: req.user.role },
      targetEntity: { entityType: 'User', entityId: user.userId },
      details: { previousStatus, newStatus: status }
    });

    return res.status(200).json({
      success: true,
      message: `User ${user.userId} status updated to ${status}.`,
      user
    });
  } catch (error) {
    next(error);
  }
};

export const assignUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid user role.' });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const profile = req.body.profile || {};
    if (role === 'STUDENT') {
      const rollNumber = String(profile.rollNumber || '').trim().toUpperCase();
      const hostelId = String(profile.hostelId || '').trim();
      const roomNumber = String(profile.roomNumber || '').trim();
      if (!rollNumber || !hostelId || !roomNumber) return res.status(400).json({ success: false, message: 'Student role requires roll number, hostel, and room.' });
      await StudentProfile.findOneAndUpdate(
        { userId: user._id },
        { $set: { userId: user._id, studentId: String(profile.studentId || rollNumber).trim(), rollNumber, hostelId, roomNumber } },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
    } else if (role === 'GUARD') {
      const guardId = String(profile.guardId || '').trim();
      const assignedHostelId = String(profile.assignedHostelId || '').trim();
      if (!guardId || !assignedHostelId) return res.status(400).json({ success: false, message: 'Guard role requires guard ID and assigned hostel.' });
      await GuardProfile.findOneAndUpdate(
        { userId: user._id },
        { $set: { userId: user._id, guardId, assignedHostelId } },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
    } else if (role === 'WARDEN') {
      const wardenId = String(profile.wardenId || '').trim();
      const assignedHostelId = String(profile.assignedHostelId || '').trim();
      if (!wardenId || !assignedHostelId) return res.status(400).json({ success: false, message: 'Warden role requires warden ID and assigned hostel.' });
      await WardenProfile.findOneAndUpdate(
        { userId: user._id },
        { $set: { userId: user._id, wardenId, assignedHostelId } },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
    }

    user.role = role;
    await user.save();

    await AuditLog.create({
      action: 'ADMIN_ASSIGN_ROLE',
      performedBy: { userId: req.user.userId, name: req.user.name, role: req.user.role },
      targetEntity: { entityType: 'User', entityId: user.userId },
      details: { assignedRole: role }
    });

    return res.status(200).json({
      success: true,
      message: `Role ${role} assigned to user ${user.userId}.`,
      user
    });
  } catch (error) {
    next(error);
  }
};

export const getSystemOverview = async (req, res, next) => {
  try {
    const [
      hostels,
      totalUsers,
      activeVisitsTotal,
      overstayVisitsTotal,
      recentAuditLogs
    ] = await Promise.all([
      Hostel.find(),
      User.countDocuments(),
      VisitRecord.countDocuments({ exitTime: null }),
      VisitRecord.countDocuments({ exitTime: null, overstayStatus: true }),
      AuditLog.find().sort({ createdAt: -1 }).limit(10)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        hostels,
        totalUsers,
        activeVisitsTotal,
        overstayVisitsTotal,
        recentAuditLogs
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, limit = 50 } = req.query;
    const query = {};
    if (action) query.action = action;

    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(Number(limit));
    return res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    next(error);
  }
};

export const getDirectorySyncStatus = (_req, res) => res.status(200).json({ enabled: isStudentDirectoryConfigured() });

export const runDirectorySync = async (req, res, next) => {
  try {
    const summary = await syncStudentDirectory();
    await AuditLog.create({
      action: 'STUDENT_DIRECTORY_SYNC',
      performedBy: { userId: req.user.userId, name: req.user.name, role: req.user.role },
      details: { created: summary.created, updated: summary.updated, skipped: summary.skipped }
    });
    return res.status(200).json({ success: true, summary });
  } catch (error) {
    error.statusCode = error.statusCode || 502;
    next(error);
  }
};
