const db = require('./db');

exports.getAllCustomersFlights = async () => {
  const [rows] = await db.query(`
    SELECT cf.*, 
           COALESCE(p.name, cf.passenger) as passenger, 
           COALESCE(p.passport, cf.passport) as passport, 
           COALESCE(p.email, cf.email) as email, 
           COALESCE(p.phone, cf.phone) as phone
    FROM CustomersFlights cf
    LEFT JOIN passengers p ON cf.passenger_id = p.id
    ORDER BY cf.id DESC
  `);
  return rows;
};

exports.getCustomerFlightById = async (id) => {
  const [rows] = await db.query('SELECT * FROM CustomersFlights WHERE id = ?', [id]);
  return rows[0];
};

exports.addCustomerFlight = async (data) => {
  const [result] = await db.query(
    'INSERT INTO CustomersFlights (passenger_id, passenger, passport, email, phone, invoiceNo, ticketNo, issuedDate, bookingRef, pnr, airlineRef, status, baggage, fareBasis, tripType, routeType, `from`, `to`, departureDate, departureTime, returnDate, returnTime, transitAirport, transitTime, outboundSecondFlightNo, returnSecondFlightNo, airline, flightNo, class, adults, handledBy, notes, segments, returnSegments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      data.passenger_id || null,
      data.passenger,
      data.passport,
      data.email,
      data.phone,
      data.invoiceNo,
      data.ticketNo,
      data.issuedDate || null,
      data.bookingRef,
      data.pnr,
      data.airlineRef,
      data.status,
      data.baggage,
      data.fareBasis,
      data.tripType,
      data.routeType,
      data.from,
      data.to,
      data.departureDate || null,
      data.departureTime,
      data.returnDate || null,
      data.returnTime,
      data.transitAirport,
      data.transitTime,
      data.outboundSecondFlightNo,
      data.returnSecondFlightNo,
      data.airline,
      data.flightNo,
      data.class,
      data.adults,
      data.handledBy,
      data.notes,
      JSON.stringify(data.segments || []),
      JSON.stringify(data.returnSegments || [])
    ]
  );
  return { id: result.insertId, ...data };
};

exports.deleteCustomerFlight = async (id) => {
  await db.query('DELETE FROM CustomersFlights WHERE id = ?', [id]);
};


exports.updateCustomerFlight = async (id, data) => {
  await db.query(
    'UPDATE CustomersFlights SET passenger_id=?, passenger=?, passport=?, email=?, phone=?, invoiceNo=?, ticketNo=?, issuedDate=?, bookingRef=?, pnr=?, airlineRef=?, status=?, baggage=?, fareBasis=?, tripType=?, routeType=?, `from`=?, `to`=?, departureDate=?, departureTime=?, returnDate=?, returnTime=?, transitAirport=?, transitTime=?, outboundSecondFlightNo=?, returnSecondFlightNo=?, airline=?, flightNo=?, class=?, adults=?, handledBy=?, notes=?, segments=?, returnSegments=? WHERE id=?',
    [
      data.passenger_id || null,
      data.passenger,
      data.passport,
      data.email,
      data.phone,
      data.invoiceNo,
      data.ticketNo,
      data.issuedDate || null,
      data.bookingRef,
      data.pnr,
      data.airlineRef,
      data.status,
      data.baggage,
      data.fareBasis,
      data.tripType,
      data.routeType,
      data.from,
      data.to,
      data.departureDate || null,
      data.departureTime,
      data.returnDate || null,
      data.returnTime,
      data.transitAirport,
      data.transitTime,
      data.outboundSecondFlightNo,
      data.returnSecondFlightNo,
      data.airline,
      data.flightNo,
      data.class,
      data.adults,
      data.handledBy,
      data.notes,
      JSON.stringify(data.segments || []),
      JSON.stringify(data.returnSegments || []),
      id
    ]
  );
  return { id, ...data };
};
