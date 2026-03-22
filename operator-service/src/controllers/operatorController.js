const bcrypt = require('bcryptjs');
const axios = require('axios');
const Operator = require('../models/Operator');
const logger = require('../config/logger');

/** GET /api/operators - Mall Admin only */
const getAllOperators = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = { is_active: true };
    if (role) filter.role = role;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const total = await Operator.countDocuments(filter);
    const operators = await Operator.find(filter)
      .select('-password_hash -refresh_token')
      .skip((page - 1) * limit).limit(parseInt(limit)).sort({ createdAt: -1 });
    res.json({ success: true, data: operators, pagination: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

/** GET /api/operators/:id */
const getOperatorById = async (req, res, next) => {
  try {
    const op = await Operator.findById(req.params.id).select('-password_hash -refresh_token');
    if (!op) return res.status(404).json({ success: false, message: 'Operator not found' });
    res.json({ success: true, data: op });
  } catch (err) { next(err); }
};

/** PUT /api/operators/:id */
const updateOperator = async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'store_name'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (['mall_admin', 'super_admin'].includes(req.operator.role)) {
      ['role', 'permissions', 'store_id', 'is_active'].forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    }
    const op = await Operator.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password_hash -refresh_token');
    if (!op) return res.status(404).json({ success: false, message: 'Operator not found' });
    res.json({ success: true, message: 'Operator updated', data: op });
  } catch (err) { next(err); }
};

/** PUT /api/operators/:id/password */
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const op = await Operator.findById(req.params.id);
    if (!op) return res.status(404).json({ success: false, message: 'Operator not found' });
    if (!await op.verifyPassword(current_password)) return res.status(401).json({ success: false, message: 'Current password incorrect' });
    const password_hash = await bcrypt.hash(new_password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    await Operator.findByIdAndUpdate(req.params.id, { password_hash, refresh_token: null });
    res.json({ success: true, message: 'Password changed. Please login again.' });
  } catch (err) { next(err); }
};

/** DELETE /api/operators/:id */
const deleteOperator = async (req, res, next) => {
  try {
    await Operator.findByIdAndUpdate(req.params.id, { is_active: false, refresh_token: null });
    res.json({ success: true, message: 'Operator deactivated' });
  } catch (err) { next(err); }
};

// ─── Mall API Proxy Actions ──────────────────────────────────────
// Operators manage mall content through this service → forwards to Mall API Service

/** POST /api/operators/actions/stores → Mall API */
const createStore = async (req, res, next) => {
  try {
    const response = await axios.post(
      `${process.env.MALL_API_SERVICE_URL}/api/stores`,
      { ...req.body, operator_id: req.operator._id.toString() },
      { headers: { Authorization: req.headers.authorization, 'x-api-key': process.env.INTERNAL_API_KEY }, timeout: 5000 }
    );
    logger.info(`Operator ${req.operator._id} created store via Mall API`);
    res.status(201).json({ success: true, message: 'Store created via Mall API Service', data: response.data.data });
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    if (err.code === 'ECONNREFUSED') return res.status(503).json({ success: false, message: 'Mall API Service unavailable' });
    next(err);
  }
};

/** PUT /api/operators/actions/stores/:storeId → Mall API */
const updateStore = async (req, res, next) => {
  try {
    const response = await axios.put(
      `${process.env.MALL_API_SERVICE_URL}/api/stores/${req.params.storeId}`,
      req.body,
      { headers: { Authorization: req.headers.authorization, 'x-api-key': process.env.INTERNAL_API_KEY }, timeout: 5000 }
    );
    res.json({ success: true, message: 'Store updated via Mall API Service', data: response.data.data });
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    if (err.code === 'ECONNREFUSED') return res.status(503).json({ success: false, message: 'Mall API Service unavailable' });
    next(err);
  }
};

/** POST /api/operators/actions/deals → Mall API */
const createDeal = async (req, res, next) => {
  try {
    const response = await axios.post(
      `${process.env.MALL_API_SERVICE_URL}/api/deals`,
      { ...req.body, created_by_operator: req.operator._id.toString() },
      { headers: { Authorization: req.headers.authorization, 'x-api-key': process.env.INTERNAL_API_KEY }, timeout: 5000 }
    );
    logger.info(`Operator ${req.operator._id} created deal via Mall API`);
    res.status(201).json({ success: true, message: 'Deal created via Mall API Service', data: response.data.data });
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    if (err.code === 'ECONNREFUSED') return res.status(503).json({ success: false, message: 'Mall API Service unavailable' });
    next(err);
  }
};

/** POST /api/operators/actions/events → Mall API */
const createEvent = async (req, res, next) => {
  try {
    const response = await axios.post(
      `${process.env.MALL_API_SERVICE_URL}/api/events`,
      { ...req.body, created_by_operator: req.operator._id.toString() },
      { headers: { Authorization: req.headers.authorization, 'x-api-key': process.env.INTERNAL_API_KEY }, timeout: 5000 }
    );
    logger.info(`Operator ${req.operator._id} created event via Mall API`);
    res.status(201).json({ success: true, message: 'Event created via Mall API Service', data: response.data.data });
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    if (err.code === 'ECONNREFUSED') return res.status(503).json({ success: false, message: 'Mall API Service unavailable' });
    next(err);
  }
};

/** GET /api/operators/actions/my-store → Mall API */
const getMyStore = async (req, res, next) => {
  try {
    if (!req.operator.store_id) return res.status(400).json({ success: false, message: 'No store assigned to this operator' });
    const response = await axios.get(
      `${process.env.MALL_API_SERVICE_URL}/api/stores/${req.operator.store_id}`,
      { timeout: 5000 }
    );
    res.json({ success: true, data: response.data.data });
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    if (err.code === 'ECONNREFUSED') return res.status(503).json({ success: false, message: 'Mall API Service unavailable' });
    next(err);
  }
};

module.exports = { getAllOperators, getOperatorById, updateOperator, changePassword, deleteOperator, createStore, updateStore, createDeal, createEvent, getMyStore };
