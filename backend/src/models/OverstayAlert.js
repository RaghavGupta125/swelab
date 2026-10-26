import mongoose from 'mongoose';

const overstayAlertSchema = new mongoose.Schema(
  {
    alertId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    visitId: {
      type: String,
      required: true,
      trim: true
    },
    requestId: {
      type: String,
      required: true,
      trim: true
    },
    hostelId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    studentRollNumber: {
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
    expectedExitTime: {
      type: Date,
      required: true
    },
    detectedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'],
      default: 'OPEN',
      index: true
    },
    acknowledgedBy: {
      type: String
    },
    acknowledgedAt: {
      type: Date
    },
    resolutionNotes: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate alert for same visit
overstayAlertSchema.index({ visitId: 1 }, { unique: true });

export const OverstayAlert = mongoose.model('OverstayAlert', overstayAlertSchema);
