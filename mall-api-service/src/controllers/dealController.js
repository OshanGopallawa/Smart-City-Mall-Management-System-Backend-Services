const axios = require('axios');
const Deal = require('../models/Deal');
const Store = require('../models/Store');
const logger = require('../config/logger');

const notifyAnalytics = async (payload) => {
  try {
    await axios.post(`${process.env.ANALYTICS_SERVICE_URL}/api/internal/events`, payload,
      { headers: { 'x-api-key': process.env.INTERNAL_API_KEY }, timeout: 3000 });
  } catch (e) { logger.warn('Analytics notify failed:', e.message); }
};

/** GET /api/deals */
const getAllDeals = async (req, res, next) => {
  try {
    const { store_id, discount_type, page = 1, limit = 20 } = req.query;
    const filter = { is_active: true, valid_until: { $gte: new Date() } };
    if (store_id) filter.store_id = store_id;
    if (discount_type) filter.discount_type = discount_type;

    const total = await Deal.countDocuments(filter);
    const deals = await Deal.find(filter)
      .populate('store_id', 'name category floor')
      .skip((page - 1) * limit).limit(parseInt(limit)).sort({ valid_until: 1 });

    res.json({ success: true, data: deals, pagination: { total, page: +page, limit: +limit } });
  } catch (err) { next(err); }
};

/** GET /api/deals/:id */
const getDealById = async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id).populate('store_id', 'name category floor');
    if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' });
    res.json({ success: true, data: deal });
  } catch (err) { next(err); }
};

/** POST /api/deals */
const createDeal = async (req, res, next) => {
  try {
    const store = await Store.findById(req.body.store_id);
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

    const deal = await Deal.create({ ...req.body, created_by_operator: req.user?.id || null });
    await notifyAnalytics({ event_type: 'deal_created', deal_id: deal._id.toString(), store_id: req.body.store_id });
    logger.info(`Deal created: ${deal._id}`);
    res.status(201).json({ success: true, message: 'Deal created', data: deal });
  } catch (err) { next(err); }
};

/** PUT /api/deals/:id */
const updateDeal = async (req, res, next) => {
  try {
    const allowed = ['title', 'description', 'discount_type', 'discount_value', 'original_price', 'valid_from', 'valid_until', 'terms_conditions', 'is_active', 'image_url'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const deal = await Deal.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' });
    logger.info(`Deal updated: ${deal._id}`);
    res.json({ success: true, message: 'Deal updated', data: deal });
  } catch (err) { next(err); }
};

/** DELETE /api/deals/:id — soft delete */
const deleteDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findByIdAndUpdate(req.params.id, { is_active: false }, { new: true });
    if (!deal) return res.status(404).json({ success: false, message: 'Deal not found' });
    res.json({ success: true, message: 'Deal deactivated' });
  } catch (err) { next(err); }
};

module.exports = { getAllDeals, getDealById, createDeal, updateDeal, deleteDeal };
