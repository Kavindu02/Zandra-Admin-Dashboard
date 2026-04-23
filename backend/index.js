const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();


const pool = require('./models/db');
pool.getConnection()
  .then(() => console.log('Database connected!'))
  .catch(err => console.error('Database connection failed:', err));

const userRoutes = require('./routes/userRoutes');

const customersFlightsRoutes = require('./routes/customersFlightsRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const profitTrackerRoutes = require('./routes/profitTrackerRoutes');
const passengerRoutes = require('./routes/passengerRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const receivableRoutes = require('./routes/receivableRoutes');
const payableRoutes = require('./routes/payableRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const geminiRoutes = require('./routes/geminiRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/receivables', receivableRoutes);
app.use('/api/payables', payableRoutes);
app.use('/api/employees', employeeRoutes);

const fs = require('fs');
const path = require('path');
let airportsData = [];
try {
  airportsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'airports.json')));
} catch (e) {
  console.log('No airports data found.');
}

app.get('/api/airports/search', (req, res) => {
  const query = (req.query.q || '').toLowerCase();
  if (!query) return res.json([]);
  
  const results = airportsData
    .filter(a => 
      (a.name && a.name.toLowerCase().includes(query)) ||
      (a.city && a.city.toLowerCase().includes(query)) ||
      (a.iata_code && a.iata_code.toLowerCase().includes(query)) ||
      (a.country && a.country.toLowerCase().includes(query))
    )
    .slice(0, 15);
  res.json(results);
});

app.use('/api/customersflights', customersFlightsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profittracker', profitTrackerRoutes);
app.use('/api/passengers', passengerRoutes);
app.use('/api/gemini', geminiRoutes);

const PORT = Number(process.env.PORT) || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use. Backend is likely already running.`);
    console.log('Stop the existing process or change PORT in .env before starting a new instance.');
    process.exit(0);
    return;
  }

  console.error('Server failed to start:', err);
  process.exit(1);
});
