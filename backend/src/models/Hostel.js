import mongoose from 'mongoose';

const hostelSchema = new mongoose.Schema(
  {
    hostelId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    hostelName: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['BOYS', 'GIRLS'],
      default: 'BOYS'
    },
    currentOccupancy: {
      type: Number,
      default: 0
    },
    activeVisitorsCount: {
      type: Number,
      default: 0
    },
    wardenId: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export const Hostel = mongoose.model('Hostel', hostelSchema);
