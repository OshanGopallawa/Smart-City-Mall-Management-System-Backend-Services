const jwt = require('jsonwebtoken');
const Operator = require('../models/Operator');
const logger = require('../config/logger');

const authenticateToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Access token required' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const operator = await Operator.findById(decoded.id).select('-password_hash -refresh_token');
    if (!operator || !operator.is_active) return res.status(403).json({ success: false, message: 'Account inactive or not found' });
    req.operator = operator;
    next();
  } catch (error) {
    logger.warn(`JWT failed: ${error.message}`);
    if (error.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expired' });
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

const requireMallAdmin = (req, res, next) => {
  if (!['mall_admin', 'super_admin'].includes(req.operator?.role))
    return res.status(403).json({ success: false, message: 'Mall Admin role required' });
  next();
};

const requireSuperAdmin = (req, res, next) => {
  if (req.operator?.role !== 'super_admin')
    return res.status(403).json({ success: false, message: 'Super Admin role required' });
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
  if (!req.operator) return res.status(401).json({ success: false, message: 'Authentication required' });
  if (['mall_admin', 'super_admin'].includes(req.operator.role) || req.operator._id.toString() === req.params.id)
    return next();
  return res.status(403).json({ success: false, message: 'Access denied' });
};

module.exports = { authenticateToken, requireMallAdmin, requireSuperAdmin, authenticateServiceKey, requireSelfOrAdmin };
