const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  logger.error(`[${status}] ${message} — ${req.method} ${req.path}`);
  res.status(status).json({ success: false, message, ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }) });
};

const notFound = (req, res) => res.status(404).json({ success: false, message: `${req.method} ${req.path} not found` });

module.exports = { errorHandler, notFound };
