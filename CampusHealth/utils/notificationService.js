const Notification = require('../models/Notification');

const notifyUser = async ({ userId, type, title, message, metadata = {} }) => {
  if (!userId) return null;
  try {
    return await Notification.create({ userId, type, title, message, metadata });
  } catch (error) {
    console.error(`Notification creation failed (${type}):`, error);
    return null;
  }
};

const notifyUsers = async (userIds, notification) => {
  const uniqueUserIds = [...new Set((userIds || []).filter(Boolean).map(String))];
  return Promise.all(uniqueUserIds.map(userId => notifyUser({ ...notification, userId })));
};

module.exports = { notifyUser, notifyUsers };
