const logger = require('../config/logger');
const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map(e => e.message).join(', '); }
  if (err.code === 11000) { status = 409; message = 'An operator with this email already exists'; }
  if (err.name === 'CastError') { status = 400; message = 'Invalid ID format'; }
  logger.error(`[${status}] ${message} — ${req.method} ${req.path}`);
  res.status(status).json({ success: false, message, ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }) });
};
const notFound = (req, res) => res.status(404).json({ success: false, message: `${req.method} ${req.path} not found` });
module.exports = { errorHandler, notFound };
