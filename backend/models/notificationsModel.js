const db = require('./db');

const ensureNotificationsTable = async () => {
  await db.query(
    'CREATE TABLE IF NOT EXISTS notifications (id INT PRIMARY KEY AUTO_INCREMENT, title VARCHAR(255) NOT NULL, message VARCHAR(500) NOT NULL, type VARCHAR(50) DEFAULT "info", isRead TINYINT(1) DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)'
  );
};

exports.getAllNotifications = async () => {
  await ensureNotificationsTable();
  const [rows] = await db.query('SELECT * FROM notifications ORDER BY created_at DESC, id DESC');
  return rows;
};

exports.addNotification = async (data) => {
  await ensureNotificationsTable();
  const [result] = await db.query(
    'INSERT INTO notifications (title, message, type, isRead) VALUES (?, ?, ?, ?)',
    [data.title, data.message, data.type || 'info', data.isRead ? 1 : 0]
  );
  const [rows] = await db.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
  return rows[0];
};

exports.updateNotificationReadStatus = async (id, isRead) => {
  await ensureNotificationsTable();
  await db.query('UPDATE notifications SET isRead = ? WHERE id = ?', [isRead ? 1 : 0, id]);
  const [rows] = await db.query('SELECT * FROM notifications WHERE id = ?', [id]);
  return rows[0];
};

exports.deleteNotification = async (id) => {
  await ensureNotificationsTable();
  await db.query('DELETE FROM notifications WHERE id = ?', [id]);
};

exports.markAllAsRead = async () => {
  await ensureNotificationsTable();
  await db.query('UPDATE notifications SET isRead = 1 WHERE isRead = 0');
};
