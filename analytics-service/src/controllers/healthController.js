const mongoose = require('mongoose');
const healthCheck = async (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbStatus = states[mongoose.connection.readyState] || 'unknown';
  const health = {
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    service: 'analytics-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: { status: dbStatus, name: mongoose.connection.name || 'analytics_service_db' },
  };
  res.status(health.status === 'ok' ? 200 : 503).json(health);
};
module.exports = { healthCheck };
