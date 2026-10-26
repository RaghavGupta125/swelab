import { Notification } from '../models/Notification.js';
import { generateId } from '../utils/tokenUtils.js';
import { sendEmailNotification } from '../utils/emailService.js';

export const createNotification = async ({
  recipientUserId,
  recipientRole,
  title,
  message,
  type,
  metadata = {},
  email = null
}) => {
  try {
    const notificationId = generateId('NOTIF');
    const notif = await Notification.create({
      notificationId,
      recipientUserId,
      recipientRole,
      title,
      message,
      type,
      metadata
    });

    // If an email address is provided, dispatch async email notification (FR-052)
    if (email) {
      sendEmailNotification({
        to: email,
        subject: `[HostGuard] ${title}`,
        text: message,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="background-color: #0F172A; color: white; padding: 12px 16px; border-radius: 6px;">
              <h2 style="margin: 0; font-size: 18px; letter-spacing: 0.5px;">HostGuard Security Alert</h2>
            </div>
            <div style="padding: 16px 0;">
              <h3 style="color: #1E293B; margin-top: 0;">${title}</h3>
              <p style="color: #475569; font-size: 15px; line-height: 1.5;">${message}</p>
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 12px; color: #94A3B8;">
              This is an automated notification from LNMIIT HostGuard Visitor Management System.
            </div>
          </div>
        `
      }).catch(err => console.error('[NotificationService Email Error]:', err));
    }

    return notif;
  } catch (error) {
    console.error('[NotificationService Error]:', error);
    return null;
  }
};

export const getUserNotifications = async (recipientUserId, role) => {
  const query = {
    $or: [
      { recipientUserId },
      { recipientRole: role }
    ]
  };
  return Notification.find(query).sort({ createdAt: -1 }).limit(50);
};

export const markNotificationAsRead = async (notificationId) => {
  return Notification.findOneAndUpdate(
    { notificationId },
    { isRead: true },
    { new: true }
  );
};

export const markAllNotificationsAsRead = async (recipientUserId) => {
  return Notification.updateMany(
    { recipientUserId, isRead: false },
    { isRead: true }
  );
};
