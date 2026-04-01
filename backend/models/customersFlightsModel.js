const db = require('./db');

exports.getAllCustomersFlights = async () => {
  const [rows] = await db.query('SELECT * FROM CustomersFlights');
  return rows;
};

exports.getCustomerFlightById = async (id) => {
  const [rows] = await db.query('SELECT * FROM CustomersFlights WHERE id = ?', [id]);
  return rows[0];
};

exports.addCustomerFlight = async (data) => {
  const [result] = await db.query(
    'INSERT INTO CustomersFlights (passenger, passport, email, phone, invoiceNo, ticketNo, pnr, status, tripType, routeType, `from`, `to`, departureDate, departureTime, airline, flightNo, class, adults, handledBy, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      data.passenger,
      data.passport,
      data.email,
      data.phone,
      data.invoiceNo,
      data.ticketNo,
      data.pnr,
      data.status,
      data.tripType,
      data.routeType,
      data.from,
      data.to,
      data.departureDate,
      data.departureTime,
      data.airline,
      data.flightNo,
      data.class,
      data.adults,
      data.handledBy,
      data.notes
    ]
  );
  return { id: result.insertId, ...data };
};

exports.deleteCustomerFlight = async (id) => {
  await db.query('DELETE FROM CustomersFlights WHERE id = ?', [id]);
};


exports.updateCustomerFlight = async (id, data) => {
  await db.query(
    'UPDATE CustomersFlights SET passenger=?, passport=?, email=?, phone=?, invoiceNo=?, ticketNo=?, pnr=?, status=?, tripType=?, routeType=?, `from`=?, `to`=?, departureDate=?, departureTime=?, airline=?, flightNo=?, class=?, adults=?, handledBy=?, notes=? WHERE id=?',
    [
      data.passenger,
      data.passport,
      data.email,
      data.phone,
      data.invoiceNo,
      data.ticketNo,
      data.pnr,
      data.status,
      data.tripType,
      data.routeType,
      data.from,
      data.to,
      data.departureDate,
      data.departureTime,
      data.airline,
      data.flightNo,
      data.class,
      data.adults,
      data.handledBy,
      data.notes,
      id
    ]
  );
  return { id, ...data };
};
