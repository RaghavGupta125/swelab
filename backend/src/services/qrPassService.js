import { QRPass } from '../models/QRPass.js';
import { generateId, generateSecureToken } from '../utils/tokenUtils.js';
import { generateQRCodeDataUrl } from '../utils/qrUtils.js';
import { PASS_STATUS } from '../config/constants.js';

export const createQRPassForRequest = async (visitRequest) => {
  // Check if active pass already exists
  const existing = await QRPass.findOne({
    requestId: visitRequest.requestId,
    status: { $in: [PASS_STATUS.ACTIVE, PASS_STATUS.IN_USE] }
  });

  if (existing) {
    return existing;
  }

  const passId = generateId('PASS');
  const token = generateSecureToken('HGQR');

  // Payload encoded inside the QR image
  // Privacy protection: contains only token and verification pointer, not raw ID details
  const qrPayload = JSON.stringify({
    passId,
    token,
    requestId: visitRequest.requestId,
    hostelId: visitRequest.hostelId,
    type: 'HOSTGUARD_PASS'
  });

  const qrCodeDataUrl = await generateQRCodeDataUrl(qrPayload);

  const qrPass = await QRPass.create({
    passId,
    requestId: visitRequest.requestId,
    token,
    validUntil: visitRequest.expectedExitTime,
    status: PASS_STATUS.ACTIVE,
    qrCodeDataUrl
  });

  return qrPass;
};

export const getQRPassByRequestId = async (requestId) => {
  return QRPass.findOne({ requestId });
};

export const getQRPassByToken = async (token) => {
  return QRPass.findOne({ token });
};

export const invalidateQRPass = async (requestId, reason = 'Checked Out') => {
  return QRPass.findOneAndUpdate(
    { requestId },
    {
      status: PASS_STATUS.CONSUMED,
      invalidatedAt: new Date(),
      invalidationReason: reason
    },
    { new: true }
  );
};
