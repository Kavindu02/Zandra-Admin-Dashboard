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

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);

app.use('/api/customersflights', customersFlightsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profittracker', profitTrackerRoutes);

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
