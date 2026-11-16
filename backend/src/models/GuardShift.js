import mongoose from 'mongoose';

const guardShiftSchema = new mongoose.Schema({
  shiftId: { type: String, required: true, unique: true, index: true },
  guardId: { type: String, required: true, index: true },
  guardName: { type: String, required: true },
  hostelId: { type: String, required: true, index: true },
  date: { type: String, required: true, index: true },
  label: { type: String, required: true, trim: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  assignedBy: { type: String, required: true }
}, { timestamps: true });

guardShiftSchema.index({ guardId: 1, date: 1 }, { unique: true });

export const GuardShift = mongoose.model('GuardShift', guardShiftSchema);
