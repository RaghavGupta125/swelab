import crypto from 'node:crypto';
import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';

export const isStudentDirectoryConfigured = () => Boolean(process.env.DIRECTORY_SYNC_URL && process.env.DIRECTORY_SYNC_TOKEN);

export const syncStudentDirectory = async () => {
  if (!isStudentDirectoryConfigured()) throw new Error('Student directory sync is not configured.');
  if (process.env.NODE_ENV === 'production' && new URL(process.env.DIRECTORY_SYNC_URL).protocol !== 'https:') {
    throw new Error('The student directory endpoint must use HTTPS in production.');
  }
  const response = await fetch(process.env.DIRECTORY_SYNC_URL, {
    headers: { Authorization: `Bearer ${process.env.DIRECTORY_SYNC_TOKEN}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`Student directory returned HTTP ${response.status}.`);
  const feed = await response.json();
  if (!Array.isArray(feed.students) || feed.students.length > 5000) {
    throw new Error('The student directory feed must contain a students array with no more than 5,000 records.');
  }

  const summary = { created: 0, updated: 0, skipped: 0, errors: [] };
  for (const row of feed.students) {
    const rollNumber = String(row.rollNumber || '').trim().toUpperCase();
    const name = String(row.name || '').trim();
    const email = String(row.email || '').trim().toLowerCase();
    const phoneNumber = String(row.phoneNumber || '').trim();
    const hostelId = String(row.hostelId || '').trim();
    const roomNumber = String(row.roomNumber || '').trim();
    if (!rollNumber || !name || !email || !phoneNumber || !hostelId || !roomNumber) {
      summary.skipped += 1;
      continue;
    }

    try {
      const existingProfile = await StudentProfile.findOne({ rollNumber });
      let user = existingProfile ? await User.findById(existingProfile.userId) : await User.findOne({ email });
      if (user && user.role !== 'STUDENT') {
        summary.skipped += 1;
        continue;
      }
      const conflictingUser = await User.findOne({ userId: rollNumber, ...(user ? { _id: { $ne: user._id } } : {}) });
      if (conflictingUser) {
        summary.skipped += 1;
        summary.errors.push(`Roll number ${rollNumber} conflicts with an existing account.`);
        continue;
      }
      if (!user) {
        user = await User.create({
          userId: rollNumber,
          name,
          email,
          phoneNumber,
          password: crypto.randomBytes(32).toString('hex'),
          role: 'STUDENT',
          accountStatus: 'ACTIVE'
        });
        summary.created += 1;
      } else {
        user.userId = rollNumber;
        user.name = name;
        user.email = email;
        user.phoneNumber = phoneNumber;
        await user.save();
        summary.updated += 1;
      }
      await StudentProfile.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            userId: user._id,
            studentId: String(row.studentId || rollNumber).trim(),
            rollNumber,
            hostelId,
            roomNumber,
            program: row.program || 'B.Tech CSE'
          },
          $setOnInsert: { activeVisitorsCount: 0 }
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
    } catch (error) {
      summary.skipped += 1;
      summary.errors.push(`Record ${rollNumber}: ${error.message}`);
    }
  }
  return summary;
};
