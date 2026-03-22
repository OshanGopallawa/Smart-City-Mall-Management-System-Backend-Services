const bcrypt = require('bcryptjs');
const axios = require('axios');
const User = require('../models/User');
const StoreVisit = require('../models/StoreVisit');
const logger = require('../config/logger');

const notifyAnalytics = async (payload) => {
  try {
    await axios.post(`${process.env.ANALYTICS_SERVICE_URL}/api/internal/events`, payload,
      { headers: { 'x-api-key': process.env.INTERNAL_API_KEY }, timeout: 3000 });
  } catch (e) { logger.warn('Analytics notify failed:', e.message); }
};

/** GET /api/users - Admin only */
const getAllUsers = async (req, res, next) => {
  try {
    const { membership_level, search, page = 1, limit = 20 } = req.query;
    const filter = { is_active: true };
    if (membership_level) filter.membership_level = membership_level;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password_hash -refresh_token')
      .skip((page - 1) * limit).limit(parseInt(limit)).sort({ createdAt: -1 });

    res.json({ success: true, data: users, pagination: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

/** GET /api/users/:id */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password_hash -refresh_token');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

/** PUT /api/users/:id */
const updateUser = async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'date_of_birth'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (req.user.role === 'admin') {
      ['membership_level', 'role', 'is_active'].forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password_hash -refresh_token');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Profile updated', data: user });
  } catch (err) { next(err); }
};

/** PUT /api/users/:id/password */
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!await user.verifyPassword(current_password)) return res.status(401).json({ success: false, message: 'Current password incorrect' });
    const password_hash = await bcrypt.hash(new_password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    await User.findByIdAndUpdate(req.params.id, { password_hash, refresh_token: null });
    res.json({ success: true, message: 'Password changed. Please login again.' });
  } catch (err) { next(err); }
};

/** DELETE /api/users/:id - soft delete */
const deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { is_active: false, refresh_token: null });
    res.json({ success: true, message: 'Account deactivated' });
  } catch (err) { next(err); }
};

/** GET /api/users/:id/visited-stores */
const getVisitedStores = async (req, res, next) => {
  try {
    const visits = await StoreVisit.find({ user_id: req.params.id }).sort({ visited_at: -1 }).limit(50);
    res.json({ success: true, data: visits, count: visits.length });
  } catch (err) { next(err); }
};

/** POST /api/users/:id/visit-store */
const recordStoreVisit = async (req, res, next) => {
  try {
    const { store_id, store_name } = req.body;
    const visit = await StoreVisit.create({ user_id: req.params.id, store_id, store_name });
    await notifyAnalytics({ event_type: 'store_visit', user_id: req.params.id, store_id });
    res.status(201).json({ success: true, message: 'Visit recorded', data: visit });
  } catch (err) { next(err); }
};

/** GET /api/users/:id/browse-stores — fetches from Mall API Service */
const browseStores = async (req, res, next) => {
  try {
    const { category, floor, search, page, limit } = req.query;
    const params = new URLSearchParams(Object.entries({ category, floor, search, page, limit }).filter(([, v]) => v));
    const response = await axios.get(`${process.env.MALL_API_SERVICE_URL}/api/stores?${params}`, { timeout: 5000 });
    res.json({ success: true, source: 'mall-api-service', data: response.data.data, pagination: response.data.pagination });
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') return res.status(503).json({ success: false, message: 'Mall API Service unavailable' });
    next(err);
  }
};

/** GET /api/users/:id/browse-deals */
const browseDeals = async (req, res, next) => {
  try {
    const response = await axios.get(`${process.env.MALL_API_SERVICE_URL}/api/deals`, { timeout: 5000 });
    res.json({ success: true, source: 'mall-api-service', data: response.data.data });
  } catch (err) {
    if (err.code === 'ECONNREFUSED') return res.status(503).json({ success: false, message: 'Mall API Service unavailable' });
    next(err);
  }
};

/** GET /api/users/:id/browse-events */
const browseEvents = async (req, res, next) => {
  try {
    const response = await axios.get(`${process.env.MALL_API_SERVICE_URL}/api/events`, { timeout: 5000 });
    res.json({ success: true, source: 'mall-api-service', data: response.data.data });
  } catch (err) {
    if (err.code === 'ECONNREFUSED') return res.status(503).json({ success: false, message: 'Mall API Service unavailable' });
    next(err);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, changePassword, deleteUser, getVisitedStores, recordStoreVisit, browseStores, browseDeals, browseEvents };
