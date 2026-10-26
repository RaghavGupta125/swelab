import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'hostguard_super_secure_jwt_secret_key_lnmiit_cs314_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

export const generateJWT = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyJWT = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

export const generateSecureToken = (prefix = 'TKN') => {
  const randomHex = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `${prefix}-${randomHex}`;
};

export const generateId = (prefix) => {
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${Date.now().toString().slice(-4)}${randomStr}`;
};
