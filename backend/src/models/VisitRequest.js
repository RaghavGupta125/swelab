import mongoose from 'mongoose';
import { REQUEST_STATUS, ID_TYPES } from '../config/constants.js';

const accompanyingGuestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    identificationType: {
      type: String,
      enum: Object.values(ID_TYPES),
      default: ID_TYPES.GOVT_ID
    },
    identificationNumber: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);

const visitRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    // Primary Visitor details (FR-010)
    visitor: {
      fullName: {
        type: String,
        required: false,
        trim: true
      },
      phoneNumber: {
        type: String,
        required: false,
        trim: true,
        index: true
      },
      identificationType: {
        type: String,
        enum: Object.values(ID_TYPES),
        required: false,
        default: ID_TYPES.AADHAAR
      },
      identificationNumber: {
        type: String,
        required: false,
        trim: true,
        index: true
      },
      // Optional vehicle number (easily demonstrated if examiner asks for vehicle tracking)
      vehicleNumber: {
        type: String,
        required: false,
        trim: true
      }
    },
    // Host student information (FR-012, BR-012)
    hostStudentRollNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },
    hostStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    hostelId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true
    },
    // Schedule & Purpose (FR-013, FR-014, BR-004)
    purpose: {
      type: String,
      required: false,
      trim: true
    },
    visitDate: {
      type: String, // 'YYYY-MM-DD' in IST
      required: false,
      index: true
    },
    expectedEntryTime: {
      type: Date,
      required: false
    },
    expectedExitTime: {
      type: Date,
      required: false
    },
    // Visitor quota and accompanying guests (FR-011, BR-001)
    totalVisitorCount: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 1
    },
    accompanyingGuests: [accompanyingGuestSchema],
    // Request state lifecycle (FR-018, Page 15, Page 52)
    requestStatus: {
      type: String,
      enum: Object.values(REQUEST_STATUS),
      required: true,
      default: REQUEST_STATUS.PENDING,
      index: true
    },
    isPreRegistration: {
      type: Boolean,
      default: false
    },
    approvedAt: {
      type: Date
    },
    rejectedAt: {
      type: Date
    },
    rejectionReason: {
      type: String,
      trim: true
    },
    cancelledAt: {
      type: Date
    },
    expiredAt: {
      type: Date
    },
    // Unguessable token for visitor pass retrieval without login (Decision 2.2)
    accessToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const VisitRequest = mongoose.model('VisitRequest', visitRequestSchema);
