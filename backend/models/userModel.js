const db = require('./db');

exports.getAllUsers = async () => {
  const [rows] = await db.query('SELECT * FROM users');
  return rows;
};
