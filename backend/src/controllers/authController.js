import { loginUser, getUserProfile } from '../services/authService.js';
import { AuditLog } from '../models/AuditLog.js';
import { User } from '../models/User.js';
import { USER_STATUS } from '../config/constants.js';
import { generateJWT } from '../utils/tokenUtils.js';
import { createOidcAuthorization, completeOidcAuthorization, isOidcConfigured } from '../services/oidcService.js';

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

export const getSsoConfig = (_req, res) => res.status(200).json({ enabled: isOidcConfigured() });

export const startSso = async (req, res, next) => {
  try {
    const { authorizationUrl, signedState } = await createOidcAuthorization();
    res.cookie('hg_oidc_state', signedState, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
      path: '/api/auth/sso'
    });
    return res.redirect(302, authorizationUrl);
  } catch (error) {
    error.statusCode = isOidcConfigured() ? 502 : 503;
    next(error);
  }
};

export const finishSso = async (req, res) => {
  const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const destination = new URL('/login', frontendUrl);
  const cookieOptions = { path: '/api/auth/sso', secure: process.env.NODE_ENV === 'production', sameSite: 'lax' };
  try {
    if (req.query.error) throw new Error('Institutional sign-in was cancelled or rejected.');
    const claims = await completeOidcAuthorization({
      code: req.query.code,
      state: req.query.state,
      signedState: req.cookies?.hg_oidc_state
    });
    const user = await User.findOne({ email: claims.email.toLowerCase() });
    if (!user || user.accountStatus !== USER_STATUS.ACTIVE) {
      destination.hash = new URLSearchParams({ ssoError: 'This institutional account is not enrolled or is inactive.' }).toString();
      return res.clearCookie('hg_oidc_state', cookieOptions).redirect(302, destination.toString());
    }
    user.lastLoginAt = new Date();
    await user.save();
    const token = generateJWT({ id: user._id, userId: user.userId, role: user.role, name: user.name, email: user.email });
    await AuditLog.create({
      action: 'USER_LOGIN_SSO',
      performedBy: { userId: user.userId, name: user.name, role: user.role },
      details: { issuer: process.env.OIDC_ISSUER },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    destination.hash = new URLSearchParams({ ssoToken: token }).toString();
    return res.clearCookie('hg_oidc_state', cookieOptions).redirect(302, destination.toString());
  } catch (error) {
    destination.hash = new URLSearchParams({ ssoError: error.message || 'Institutional sign-in failed.' }).toString();
    return res.clearCookie('hg_oidc_state', cookieOptions).redirect(302, destination.toString());
  }
};
