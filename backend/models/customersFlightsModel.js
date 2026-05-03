const db = require('./db');

const ensureTableExists = async () => {
  // Migration for Linux case-sensitivity
  try {
    const [tables] = await db.query("SHOW TABLES LIKE 'CustomersFlights'");
    if (tables.length > 0) {
      // Also check if lowercase already exists to avoid "Table already exists" error
      const [lowerTables] = await db.query("SHOW TABLES LIKE 'customersflights'");
      if (lowerTables.length === 0) {
        console.log('Renaming CustomersFlights to customersflights for Linux compatibility...');
        await db.query("RENAME TABLE CustomersFlights TO customersflights");
      }
    }
  } catch (err) {
    console.error('Migration error (renaming):', err.message);
  }

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
    CREATE TABLE IF NOT EXISTS customersflights (
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Ensure columns exist for existing tables
  const safeAlter = async (sql) => {
    try { await db.query(sql); } catch (e) {}
  };
  await safeAlter('ALTER TABLE customersflights ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await safeAlter('ALTER TABLE customersflights ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
};

exports.getAllCustomersFlights = async () => {
  await ensureTableExists();
  const [rows] = await db.query(`
    SELECT cf.*, 
           COALESCE(p.name, cf.passenger) as passenger, 
           COALESCE(p.passport, cf.passport) as passport, 
           COALESCE(p.email, cf.email) as email, 
           COALESCE(p.phone, cf.phone) as phone
    FROM customersflights cf
    LEFT JOIN passengers p ON cf.passenger_id = p.id
    ORDER BY cf.id DESC
  `);
  return rows;
};

exports.getCustomerFlightById = async (id) => {
  await ensureTableExists();
  const [rows] = await db.query('SELECT * FROM customersflights WHERE id = ?', [id]);
  return rows[0];
};

exports.addCustomerFlight = async (data) => {
  await ensureTableExists();
  const [result] = await db.query(
    'INSERT INTO customersflights (passenger_id, passenger, passport, email, phone, invoiceNo, ticketNo, issuedDate, bookingRef, pnr, airlineRef, status, baggage, fareBasis, tripType, routeType, `from`, `to`, departureDate, departureTime, returnDate, returnTime, transitAirport, transitTime, outboundSecondFlightNo, returnSecondFlightNo, airline, airlineLogo, flightNo, class, adults, handledBy, employeeId, notes, segments, returnSegments, travelDate, destination, invoiceStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
  await db.query('DELETE FROM customersflights WHERE id = ?', [id]);
};


exports.updateCustomerFlight = async (id, data) => {
  await db.query(
    'UPDATE customersflights SET passenger_id=?, passenger=?, passport=?, email=?, phone=?, invoiceNo=?, ticketNo=?, issuedDate=?, bookingRef=?, pnr=?, airlineRef=?, status=?, baggage=?, fareBasis=?, tripType=?, routeType=?, `from`=?, `to`=?, departureDate=?, departureTime=?, returnDate=?, returnTime=?, transitAirport=?, transitTime=?, outboundSecondFlightNo=?, returnSecondFlightNo=?, airline=?, airlineLogo=?, flightNo=?, class=?, adults=?, handledBy=?, employeeId=?, notes=?, segments=?, returnSegments=?, travelDate=?, destination=?, invoiceStatus=? WHERE id=?',
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
  await db.query('UPDATE customersflights SET invoiceStatus = ? WHERE id = ?', [status, id]);
};
