// server/server.js

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const repoRoutes = require('./routes/repos');
const scanRoutes = require('./routes/scan');

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

app.use('/api/auth', authRoutes);
app.use('/api/repos', repoRoutes);
app.use('/api/scan', scanRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DevDebt server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});