import { verifyJWT } from '../utils/tokenUtils.js';
import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { GuardProfile } from '../models/GuardProfile.js';
import { WardenProfile } from '../models/WardenProfile.js';
import { USER_STATUS } from '../config/constants.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No session token provided.'
      });
    }

    const decoded = verifyJWT(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session token. Please log in again.'
      });
    }

    const user = await User.findById(decoded.id || decoded.userId).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.'
      });
    }

    // Enforce FR-007: Deny auth immediately for BLOCKED or INACTIVE users
    if (user.accountStatus === USER_STATUS.BLOCKED) {
      return res.status(403).json({
        success: false,
        message: 'Account is blocked by administration. Access denied.'
      });
    }

    if (user.accountStatus === USER_STATUS.INACTIVE) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact administration.'
      });
    }

    // Attach user
    req.user = user;

    // Attach role-specific profile if available
    if (user.role === 'STUDENT') {
      const studentProfile = await StudentProfile.findOne({ userId: user._id });
      req.studentProfile = studentProfile;
    } else if (user.role === 'GUARD') {
      const guardProfile = await GuardProfile.findOne({ userId: user._id });
      req.guardProfile = guardProfile;
    } else if (user.role === 'WARDEN') {
      const wardenProfile = await WardenProfile.findOne({ userId: user._id });
      req.wardenProfile = wardenProfile;
    }

    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal authentication error.'
    });
  }
};

/**
 * RBAC authorization middleware (FR-005)
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
};
