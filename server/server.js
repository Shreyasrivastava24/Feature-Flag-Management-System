require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const { authMiddleware } = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());
 
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'You accessed a protected route!', user: req.user });
});

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const flagRoutes = require('./routes/flags');
app.use('/api/flags', flagRoutes);

const checkRoutes = require('./routes/check');
app.use('/api/check', checkRoutes);

app.get('/', (req, res) => {
  res.send('Feature Flag API is running');
});

app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'You accessed a protected route!', user: req.user });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});