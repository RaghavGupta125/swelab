import mongoose from 'mongoose';

const visitRecordSchema = new mongoose.Schema(
  {
    visitId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    requestId: {
      type: String,
      required: true,
      unique: true, // BR-008: exactly one gate entry per VisitRequest
      trim: true,
      index: true
    },
    passId: {
      type: String,
      required: true,
      trim: true
    },
    hostStudentRollNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    hostelId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    visitorName: {
      type: String,
      required: true,
      trim: true
    },
    visitorPhone: {
      type: String,
      required: true,
      trim: true
    },
    totalVisitorCount: {
      type: Number,
      required: true,
      default: 1
    },
    entryTime: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    exitTime: {
      type: Date,
      default: null,
      index: true
    },
    expectedExitTime: {
      type: Date,
      required: true
    },
    overstayStatus: {
      type: Boolean,
      default: false,
      index: true
    },
    guardId: {
      type: String,
      required: true,
      trim: true
    },
    exitGuardId: {
      type: String,
      trim: true
    },
    stayDurationMinutes: {
      type: Number,
      default: 0
    },
    notes: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export const VisitRecord = mongoose.model('VisitRecord', visitRecordSchema);
