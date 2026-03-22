const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const logger = require('../config/logger');

const genAccess = (user) => jwt.sign(
  { id: user._id, email: user.email, role: user.role, membership_level: user.membership_level },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

const genRefresh = (id) => jwt.sign(
  { id, type: 'refresh' },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
);

const notifyAnalytics = async (payload) => {
  try {
    await axios.post(`${process.env.ANALYTICS_SERVICE_URL}/api/internal/events`, payload,
      { headers: { 'x-api-key': process.env.INTERNAL_API_KEY }, timeout: 3000 });
  } catch (e) { logger.warn('Analytics notify failed (non-blocking):', e.message); }
};

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, date_of_birth } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ success: false, message: 'An account with this email already exists' });

    const password_hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const user = await User.create({ name, email: email.toLowerCase(), password_hash, phone, date_of_birth });

    const access_token = genAccess(user);
    const refresh_token = genRefresh(user._id);
    await User.findByIdAndUpdate(user._id, { refresh_token, last_login: new Date() });

    await notifyAnalytics({ event_type: 'user_registered', user_id: user._id.toString() });

    logger.info(`User registered: ${user._id}`);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user: user.toSafeJSON(), tokens: { access_token, refresh_token, expires_in: '7d' } },
    });
  } catch (err) { next(err); }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.is_active) return res.status(401).json({ success: false, message: 'Invalid credentials or account inactive' });

    const valid = await user.verifyPassword(password);
    if (!valid) { logger.warn(`Failed login: ${email}`); return res.status(401).json({ success: false, message: 'Invalid email or password' }); }

    const access_token = genAccess(user);
    const refresh_token = genRefresh(user._id);
    await User.findByIdAndUpdate(user._id, { refresh_token, last_login: new Date() });

    await notifyAnalytics({ event_type: 'user_login', user_id: user._id.toString() });

    logger.info(`User login: ${user._id}`);
    res.json({ success: true, message: 'Login successful', data: { user: user.toSafeJSON(), tokens: { access_token, refresh_token, expires_in: '7d' } } });
  } catch (err) { next(err); }
};

/**
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ success: false, message: 'Refresh token required' });

    let decoded;
    try { decoded = jwt.verify(refresh_token, process.env.JWT_SECRET); }
    catch { return res.status(403).json({ success: false, message: 'Invalid or expired refresh token' }); }

    if (decoded.type !== 'refresh') return res.status(403).json({ success: false, message: 'Invalid token type' });

    const user = await User.findById(decoded.id);
    if (!user || !user.is_active || user.refresh_token !== refresh_token)
      return res.status(403).json({ success: false, message: 'Refresh token revoked' });

    const access_token = genAccess(user);
    const new_refresh = genRefresh(user._id);
    await User.findByIdAndUpdate(user._id, { refresh_token: new_refresh });

    res.json({ success: true, data: { tokens: { access_token, refresh_token: new_refresh, expires_in: '7d' } } });
  } catch (err) { next(err); }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refresh_token: null });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) { next(err); }
};

const getMe = (req, res) => res.json({ success: true, data: req.user });

module.exports = { register, login, refreshToken, logout, getMe };
