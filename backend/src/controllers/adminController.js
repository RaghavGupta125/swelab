import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { GuardProfile } from '../models/GuardProfile.js';
import { WardenProfile } from '../models/WardenProfile.js';
import { Hostel } from '../models/Hostel.js';
import { VisitRecord } from '../models/VisitRecord.js';
import { AuditLog } from '../models/AuditLog.js';

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

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
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
