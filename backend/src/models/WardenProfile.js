import mongoose from 'mongoose';

const wardenProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    wardenId: {
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
    officePhone: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export const WardenProfile = mongoose.model('WardenProfile', wardenProfileSchema);
