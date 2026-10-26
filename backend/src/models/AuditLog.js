import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    performedBy: {
      userId: String,
      name: String,
      role: String
    },
    targetEntity: {
      entityType: String,
      entityId: String
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
