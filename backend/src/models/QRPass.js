import mongoose from 'mongoose';
import { PASS_STATUS } from '../config/constants.js';

const qrPassSchema = new mongoose.Schema(
  {
    passId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    requestId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    generatedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    validUntil: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(PASS_STATUS),
      default: PASS_STATUS.ACTIVE,
      index: true
    },
    qrCodeDataUrl: {
      type: String // Base64 data URL
    },
    invalidatedAt: {
      type: Date
    },
    invalidationReason: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export const QRPass = mongoose.model('QRPass', qrPassSchema);
