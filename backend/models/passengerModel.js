const db = require('./db');

exports.getAllPassengers = async () => {
  const [rows] = await db.query('SELECT * FROM passengers ORDER BY created_at DESC');
  return rows;
};

exports.getPassengerById = async (id) => {
  const [rows] = await db.query('SELECT * FROM passengers WHERE id = ?', [id]);
  return rows[0];
};

exports.addPassenger = async (data) => {
  const [result] = await db.query(
    'INSERT INTO passengers (name, passport, email, phone) VALUES (?, ?, ?, ?)',
    [data.name, data.passport, data.email, data.phone]
  );
  return { id: result.insertId, ...data };
};

exports.updatePassenger = async (id, data) => {
  await db.query(
    'UPDATE passengers SET name=?, passport=?, email=?, phone=? WHERE id=?',
    [data.name, data.passport, data.email, data.phone, id]
  );
  return { id, ...data };
};

exports.deletePassenger = async (id) => {
  await db.query('DELETE FROM passengers WHERE id = ?', [id]);
};
