import { loginUser, getUserProfile } from '../services/authService.js';
import { AuditLog } from '../models/AuditLog.js';

export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const { user, token } = await loginUser({ identifier, password });

    // Set secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });

    // Record audit log
    await AuditLog.create({
      action: 'USER_LOGIN',
      performedBy: { userId: user.userId, name: user.name, role: user.role },
      details: { identifier },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user,
      token
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    // Clear cookie (FR-003)
    res.clearCookie('token');

    if (req.user) {
      await AuditLog.create({
        action: 'USER_LOGOUT',
        performedBy: { userId: req.user.userId, name: req.user.name, role: req.user.role },
        ipAddress: req.ip
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully. Session invalidated.'
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const userProfile = await getUserProfile(req.user._id);
    return res.status(200).json({
      success: true,
      user: userProfile
    });
  } catch (error) {
    next(error);
  }
};
