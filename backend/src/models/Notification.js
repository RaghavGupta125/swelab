import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    notificationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    recipientUserId: {
      type: String, // Can be userId, rollNumber, or role target like 'WARDEN_BH1'
      required: true,
      trim: true,
      index: true
    },
    recipientRole: {
      type: String,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: [
        'REQUEST_CREATED',
        'REQUEST_APPROVED',
        'REQUEST_REJECTED',
        'GATE_ENTRY',
        'GATE_EXIT',
        'OVERSTAY_ALERT',
        'REQUEST_EXPIRED',
        'REQUEST_CANCELLED',
        'SYSTEM'
      ],
      default: 'SYSTEM',
      index: true
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

export const Notification = mongoose.model('Notification', notificationSchema);
