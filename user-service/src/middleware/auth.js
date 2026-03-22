const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

const authenticateToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Access token required' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password_hash -refresh_token');
    if (!user || !user.is_active) return res.status(403).json({ success: false, message: 'Account inactive or not found' });
    req.user = user;
    next();
  } catch (error) {
    logger.warn(`JWT failed: ${error.message}`);
    if (error.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expired' });
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin role required' });
  next();
};

const authenticateServiceKey = (req, res, next) => {
  if (req.headers['x-api-key'] !== process.env.INTERNAL_API_KEY) {
    logger.warn(`Bad service key from ${req.ip}`);
    return res.status(401).json({ success: false, message: 'Invalid service API key' });
  }
  next();
};

const requireSelfOrAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
  if (req.user.role === 'admin' || req.user._id.toString() === req.params.id) return next();
  return res.status(403).json({ success: false, message: 'Access denied' });
};

module.exports = { authenticateToken, requireAdmin, authenticateServiceKey, requireSelfOrAdmin };
