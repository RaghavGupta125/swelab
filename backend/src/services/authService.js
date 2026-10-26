import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { GuardProfile } from '../models/GuardProfile.js';
import { WardenProfile } from '../models/WardenProfile.js';
import { generateJWT } from '../utils/tokenUtils.js';
import { USER_STATUS } from '../config/constants.js';

export const loginUser = async ({ identifier, password }) => {
  // FR-002: Uniform error without revealing whether identifier or password was invalid
  const genericAuthError = new Error('Invalid credentials provided.');
  genericAuthError.statusCode = 401;

  if (!identifier || !password) {
    throw genericAuthError;
  }

  // Identifier can be email or rollNumber/guardId
  const cleanId = identifier.trim();
  let user = await User.findOne({
    $or: [
      { email: cleanId.toLowerCase() },
      { userId: cleanId }
    ]
  }).select('+password');

  // If not found by email or userId, search by Student rollNumber
  if (!user) {
    const student = await StudentProfile.findOne({ rollNumber: cleanId.toUpperCase() });
    if (student) {
      user = await User.findById(student.userId).select('+password');
    }
  }

  // If still not found, search by Guard guardId
  if (!user) {
    const guard = await GuardProfile.findOne({ guardId: cleanId });
    if (guard) {
      user = await User.findById(guard.userId).select('+password');
    }
  }

  if (!user) {
    throw genericAuthError;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw genericAuthError;
  }

  // FR-007: Deny auth if BLOCKED or INACTIVE
  if (user.accountStatus === USER_STATUS.BLOCKED) {
    const blockedError = new Error('Account has been blocked by administration. Access denied.');
    blockedError.statusCode = 403;
    throw blockedError;
  }

  if (user.accountStatus === USER_STATUS.INACTIVE) {
    const inactiveError = new Error('Account is inactive. Please contact administration.');
    inactiveError.statusCode = 403;
    throw inactiveError;
  }

  user.lastLoginAt = new Date();
  await user.save();

  // Load profile details
  let profile = null;
  if (user.role === 'STUDENT') {
    profile = await StudentProfile.findOne({ userId: user._id });
  } else if (user.role === 'GUARD') {
    profile = await GuardProfile.findOne({ userId: user._id });
  } else if (user.role === 'WARDEN') {
    profile = await WardenProfile.findOne({ userId: user._id });
  }

  const token = generateJWT({
    id: user._id,
    userId: user.userId,
    role: user.role,
    name: user.name,
    email: user.email
  });

  return {
    user: {
      _id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      accountStatus: user.accountStatus,
      profile
    },
    token
  };
};

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  let profile = null;
  if (user.role === 'STUDENT') {
    profile = await StudentProfile.findOne({ userId: user._id });
  } else if (user.role === 'GUARD') {
    profile = await GuardProfile.findOne({ userId: user._id });
  } else if (user.role === 'WARDEN') {
    profile = await WardenProfile.findOne({ userId: user._id });
  }

  return {
    _id: user._id,
    userId: user.userId,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    accountStatus: user.accountStatus,
    profile
  };
};
