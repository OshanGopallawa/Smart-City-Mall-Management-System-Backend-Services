const mongoose = require('mongoose');
const healthCheck = async (req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbStatus = dbState[mongoose.connection.readyState] || 'unknown';
  const health = {
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    service: 'user-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: { status: dbStatus, name: mongoose.connection.name || 'user_service_db' },
  };
  res.status(health.status === 'ok' ? 200 : 503).json(health);
};
module.exports = { healthCheck };
