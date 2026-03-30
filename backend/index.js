const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();


const pool = require('./models/db');
pool.getConnection()
  .then(() => console.log('Database connected!'))
  .catch(err => console.error('Database connection failed:', err));

const userRoutes = require('./routes/userRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
