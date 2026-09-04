const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { pool, initDB } = require('./db');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const workspaceRoutes = require('./routes/workspaces');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Initialize database
initDB();

// Routes
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/workspaces', workspaceRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});