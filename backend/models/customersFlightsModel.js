const db = require('./db');

const ensureTableExists = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS passengers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      passport VARCHAR(100),
      email VARCHAR(255),
      phone VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS CustomersFlights (
      id int(11) NOT NULL AUTO_INCREMENT,
      passenger_id int(11) DEFAULT NULL,
      passenger varchar(100) DEFAULT NULL,
      passport varchar(50) DEFAULT NULL,
      email varchar(100) DEFAULT NULL,
      phone varchar(20) DEFAULT NULL,
      invoiceNo varchar(50) DEFAULT NULL,
      ticketNo varchar(50) DEFAULT NULL,
      issuedDate varchar(255) DEFAULT NULL,
      bookingRef varchar(255) DEFAULT NULL,
      pnr varchar(50) DEFAULT NULL,
      airlineRef varchar(255) DEFAULT NULL,
      status varchar(20) DEFAULT NULL,
      baggage varchar(255) DEFAULT NULL,
      fareBasis varchar(255) DEFAULT NULL,
      tripType varchar(20) DEFAULT NULL,
      routeType varchar(20) DEFAULT NULL,
      \`from\` varchar(10) DEFAULT NULL,
      \`to\` varchar(10) DEFAULT NULL,
      departureDate date DEFAULT NULL,
      departureTime varchar(10) DEFAULT NULL,
      airline varchar(50) DEFAULT NULL,
      flightNo varchar(20) DEFAULT NULL,
      class varchar(20) DEFAULT NULL,
      adults int(11) DEFAULT NULL,
      handledBy varchar(100) DEFAULT NULL,
      employeeId INT NULL,
      notes text DEFAULT NULL,
      segments text DEFAULT NULL,
      returnSegments longtext DEFAULT NULL,
      returnDate date DEFAULT NULL,
      returnTime varchar(10) DEFAULT NULL,
      transitAirport varchar(100) DEFAULT NULL,
      transitTime varchar(20) DEFAULT NULL,
      outboundSecondFlightNo varchar(20) DEFAULT NULL,
      returnSecondFlightNo varchar(20) DEFAULT NULL,
      airlineLogo varchar(500) DEFAULT NULL,
      travelDate date DEFAULT NULL,
      destination varchar(255) DEFAULT NULL,
      invoiceStatus enum('Pending','Approve') DEFAULT 'Pending',
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

exports.getAllCustomersFlights = async () => {
  await ensureTableExists();
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
  await ensureTableExists();
  const [rows] = await db.query('SELECT * FROM CustomersFlights WHERE id = ?', [id]);
  return rows[0];
};

exports.addCustomerFlight = async (data) => {
  await ensureTableExists();
  const [result] = await db.query(
    'INSERT INTO CustomersFlights (passenger_id, passenger, passport, email, phone, invoiceNo, ticketNo, issuedDate, bookingRef, pnr, airlineRef, status, baggage, fareBasis, tripType, routeType, `from`, `to`, departureDate, departureTime, returnDate, returnTime, transitAirport, transitTime, outboundSecondFlightNo, returnSecondFlightNo, airline, airlineLogo, flightNo, class, adults, handledBy, employeeId, notes, segments, returnSegments, travelDate, destination, invoiceStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
      data.airlineLogo || null,
      data.flightNo,
      data.class,
      data.adults,
      data.handledBy,
      data.employeeId || null,
      data.notes,
      JSON.stringify(data.segments || []),
      JSON.stringify(data.returnSegments || []),
      data.travelDate || null,
      data.destination || null,
      data.invoiceStatus || 'Pending'
    ]
  );
  return { id: result.insertId, ...data };
};

exports.deleteCustomerFlight = async (id) => {
  await db.query('DELETE FROM CustomersFlights WHERE id = ?', [id]);
};


exports.updateCustomerFlight = async (id, data) => {
  await db.query(
    'UPDATE CustomersFlights SET passenger_id=?, passenger=?, passport=?, email=?, phone=?, invoiceNo=?, ticketNo=?, issuedDate=?, bookingRef=?, pnr=?, airlineRef=?, status=?, baggage=?, fareBasis=?, tripType=?, routeType=?, `from`=?, `to`=?, departureDate=?, departureTime=?, returnDate=?, returnTime=?, transitAirport=?, transitTime=?, outboundSecondFlightNo=?, returnSecondFlightNo=?, airline=?, airlineLogo=?, flightNo=?, class=?, adults=?, handledBy=?, employeeId=?, notes=?, segments=?, returnSegments=?, travelDate=?, destination=?, invoiceStatus=? WHERE id=?',
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
      data.airlineLogo || null,
      data.flightNo,
      data.class,
      data.adults,
      data.handledBy,
      data.employeeId || null,
      data.notes,
      JSON.stringify(data.segments || []),
      JSON.stringify(data.returnSegments || []),
      data.travelDate || null,
      data.destination || null,
      data.invoiceStatus || 'Pending',
      id
    ]
  );
  return { id, ...data };
};
exports.updateInvoiceStatus = async (id, status) => {
  await ensureTableExists();
  await db.query('UPDATE CustomersFlights SET invoiceStatus = ? WHERE id = ?', [status, id]);
};
