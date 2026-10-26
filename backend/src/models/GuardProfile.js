import mongoose from 'mongoose';

const guardProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    guardId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    assignedHostelId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    badgeNumber: {
      type: String,
      trim: true
    },
    isOnDuty: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const GuardProfile = mongoose.model('GuardProfile', guardProfileSchema);
