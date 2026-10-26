import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../services/notificationService.js';

export const getMyNotifications = async (req, res, next) => {
  try {
    const recipientUserId = req.studentProfile ? req.studentProfile.rollNumber : req.user.userId;
    const notifications = await getUserNotifications(recipientUserId, req.user.role);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const notification = await markNotificationAsRead(notificationId);
    return res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const recipientUserId = req.studentProfile ? req.studentProfile.rollNumber : req.user.userId;
    await markAllNotificationsAsRead(recipientUserId);
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    next(error);
  }
};
