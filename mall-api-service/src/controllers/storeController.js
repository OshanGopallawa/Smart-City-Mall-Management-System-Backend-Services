const axios = require('axios');
const Store = require('../models/Store');
const Deal = require('../models/Deal');
const logger = require('../config/logger');

const notifyAnalytics = async (payload) => {
  try {
    await axios.post(`${process.env.ANALYTICS_SERVICE_URL}/api/internal/events`, payload,
      { headers: { 'x-api-key': process.env.INTERNAL_API_KEY }, timeout: 3000 });
  } catch (e) { logger.warn('Analytics notify failed:', e.message); }
};

/** GET /api/stores */
const getAllStores = async (req, res, next) => {
  try {
    const { category, floor, search, page = 1, limit = 20 } = req.query;
    const filter = { is_active: true };
    if (category) filter.category = category;
    if (floor) filter.floor = floor;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const total = await Store.countDocuments(filter);
    const stores = await Store.find(filter)
      .skip((page - 1) * limit).limit(parseInt(limit)).sort({ name: 1 });

    res.json({ success: true, data: stores, pagination: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

/** GET /api/stores/:id */
const getStoreById = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

    // Attach active deals
    const deals = await Deal.find({ store_id: req.params.id, is_active: true, valid_until: { $gte: new Date() } });
    res.json({ success: true, data: { ...store.toObject(), deals } });
  } catch (err) { next(err); }
};

/** POST /api/stores */
const createStore = async (req, res, next) => {
  try {
    const store = await Store.create(req.body);
    await notifyAnalytics({ event_type: 'store_created', store_id: store._id.toString(), store_name: store.name, operator_id: req.body.operator_id });
    logger.info(`Store created: ${store._id} — ${store.name}`);
    res.status(201).json({ success: true, message: 'Store created successfully', data: store });
  } catch (err) { next(err); }
};

/** PUT /api/stores/:id */
const updateStore = async (req, res, next) => {
  try {
    const allowed = ['name', 'category', 'description', 'floor', 'unit_number', 'opening_hours', 'contact_phone', 'contact_email', 'logo_url', 'is_active'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const store = await Store.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    logger.info(`Store updated: ${store._id}`);
    res.json({ success: true, message: 'Store updated', data: store });
  } catch (err) { next(err); }
};

/** DELETE /api/stores/:id — soft delete */
const deleteStore = async (req, res, next) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, { is_active: false }, { new: true });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    logger.info(`Store deactivated: ${store._id}`);
    res.json({ success: true, message: 'Store deactivated' });
  } catch (err) { next(err); }
};

/** GET /api/stores/:id/deals */
const getStoreDeals = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    const deals = await Deal.find({ store_id: req.params.id, is_active: true, valid_until: { $gte: new Date() } }).sort({ valid_until: 1 });
    res.json({ success: true, data: deals, count: deals.length });
  } catch (err) { next(err); }
};

module.exports = { getAllStores, getStoreById, createStore, updateStore, deleteStore, getStoreDeals };
