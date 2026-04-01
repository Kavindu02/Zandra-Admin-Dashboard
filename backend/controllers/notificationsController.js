const Notifications = require('../models/notificationsModel');

exports.getNotifications = async (req, res) => {
  try {
    const data = await Notifications.getAllNotifications();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addNotification = async (req, res) => {
  try {
    const data = await Notifications.addNotification(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateReadStatus = async (req, res) => {
  try {
    const isRead = req.body.isRead !== undefined ? Boolean(req.body.isRead) : true;
    const data = await Notifications.updateNotificationReadStatus(req.params.id, isRead);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notifications.markAllAsRead();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    await Notifications.deleteNotification(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
