const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const Operator = require('../models/Operator');
const logger = require('../config/logger');

const genAccess = (op) => jwt.sign(
  { id: op._id, email: op.email, role: op.role, store_id: op.store_id },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

const genRefresh = (id) => jwt.sign(
  { id, type: 'refresh' },
  process.env.JWT_SECRET,
  { expiresIn: '30d' }
);

const notifyAnalytics = async (payload) => {
  try {
    await axios.post(`${process.env.ANALYTICS_SERVICE_URL}/api/internal/events`, payload,
      { headers: { 'x-api-key': process.env.INTERNAL_API_KEY }, timeout: 3000 });
  } catch (e) { logger.warn('Analytics notify failed:', e.message); }
};

/** POST /api/auth/register */
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, store_id, store_name, permissions } = req.body;
    const existing = await Operator.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ success: false, message: 'An operator with this email already exists' });

    const password_hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const operator = await Operator.create({
      name, email: email.toLowerCase(), password_hash, phone,
      role: role || 'store_manager', store_id, store_name,
      permissions: permissions || ['manage_deals', 'manage_events'],
    });

    const access_token = genAccess(operator);
    const refresh_token = genRefresh(operator._id);
    await Operator.findByIdAndUpdate(operator._id, { refresh_token, last_login: new Date() });

    logger.info(`Operator registered: ${operator._id} role: ${operator.role}`);
    res.status(201).json({
      success: true,
      message: 'Operator account created',
      data: { operator: operator.toSafeJSON(), tokens: { access_token, refresh_token, expires_in: '7d' } },
    });
  } catch (err) { next(err); }
};

/** POST /api/auth/login */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const operator = await Operator.findOne({ email: email.toLowerCase() });
    if (!operator || !operator.is_active) return res.status(401).json({ success: false, message: 'Invalid credentials or account inactive' });

    const valid = await operator.verifyPassword(password);
    if (!valid) { logger.warn(`Failed operator login: ${email}`); return res.status(401).json({ success: false, message: 'Invalid email or password' }); }

    const access_token = genAccess(operator);
    const refresh_token = genRefresh(operator._id);
    await Operator.findByIdAndUpdate(operator._id, { refresh_token, last_login: new Date() });

    await notifyAnalytics({ event_type: 'user_login', user_id: operator._id.toString() });

    logger.info(`Operator login: ${operator._id}`);
    res.json({ success: true, message: 'Login successful', data: { operator: operator.toSafeJSON(), tokens: { access_token, refresh_token, expires_in: '7d' } } });
  } catch (err) { next(err); }
};

/** POST /api/auth/refresh */
const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ success: false, message: 'Refresh token required' });
    let decoded;
    try { decoded = jwt.verify(refresh_token, process.env.JWT_SECRET); }
    catch { return res.status(403).json({ success: false, message: 'Invalid or expired refresh token' }); }
    if (decoded.type !== 'refresh') return res.status(403).json({ success: false, message: 'Invalid token type' });
    const operator = await Operator.findById(decoded.id);
    if (!operator || !operator.is_active || operator.refresh_token !== refresh_token)
      return res.status(403).json({ success: false, message: 'Refresh token revoked' });
    const access_token = genAccess(operator);
    const new_refresh = genRefresh(operator._id);
    await Operator.findByIdAndUpdate(operator._id, { refresh_token: new_refresh });
    res.json({ success: true, data: { tokens: { access_token, refresh_token: new_refresh, expires_in: '7d' } } });
  } catch (err) { next(err); }
};

/** POST /api/auth/logout */
const logout = async (req, res, next) => {
  try {
    await Operator.findByIdAndUpdate(req.operator._id, { refresh_token: null });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) { next(err); }
};

const getMe = (req, res) => res.json({ success: true, data: req.operator });

module.exports = { register, login, refreshToken, logout, getMe };
