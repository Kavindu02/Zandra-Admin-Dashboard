async function checkFlight() {
  try {
    const [rows] = await pool.query('SELECT * FROM customersflights WHERE id = 27');
    console.log('Flight 27:', JSON.stringify(rows[0], null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
checkFlight();
