import mongoose from 'mongoose';
import { WORKER_TYPES, USER_STATUS } from '../config/constants.js';

const workerSchema = new mongoose.Schema(
  {
    workerId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    workerType: {
      type: String,
      enum: Object.values(WORKER_TYPES),
      required: true,
      default: WORKER_TYPES.PERMANENT
    },
    department: {
      type: String, // e.g. 'Housekeeping', 'Electrical', 'Mess', 'Plumbing'
      default: 'Housekeeping'
    },
    assignedHostelId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    qrToken: {
      type: String,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE
    },
    currentlyInside: {
      type: Boolean,
      default: false
    },
    lastEntryTime: {
      type: Date
    },
    lastExitTime: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export const Worker = mongoose.model('Worker', workerSchema);
