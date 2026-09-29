require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const { authMiddleware } = require('./middleware/auth');
const redisClient = require('./config/redis');

const app = express();

app.use(cors());
app.use(express.json());
 
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'You accessed a protected route!', user: req.user });
});

const clientAppRoutes = require('./routes/Clientapps');
app.use('/api/client-apps', clientAppRoutes);

const auditRoutes = require('./routes/audit');
app.use('/api/audit-logs', auditRoutes);

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const flagRoutes = require('./routes/flags');
app.use('/api/flags', flagRoutes);

const checkRoutes = require('./routes/check');
app.use('/api/check', checkRoutes);

app.get('/', (req, res) => {
  res.send('Feature Flag API is running');
});


const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});