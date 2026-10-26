import mongoose from 'mongoose';

const guardAttendanceSchema = new mongoose.Schema(
  {
    attendanceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    guardId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    guardName: {
      type: String,
      trim: true
    },
    hostelId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    date: {
      type: String, // 'YYYY-MM-DD'
      required: true,
      index: true
    },
    checkInTime: {
      type: Date,
      required: true,
      default: Date.now
    },
    checkOutTime: {
      type: Date,
      default: null
    },
    shiftHours: {
      type: String,
      default: 'General Day (06:00 - 19:00)'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to verify attendance per guard and date
guardAttendanceSchema.index({ guardId: 1, date: 1 });

export const GuardAttendance = mongoose.model('GuardAttendance', guardAttendanceSchema);
