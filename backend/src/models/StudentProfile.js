import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    rollNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
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
    program: {
      type: String,
      default: 'B.Tech CSE'
    },
    activeVisitorsCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
