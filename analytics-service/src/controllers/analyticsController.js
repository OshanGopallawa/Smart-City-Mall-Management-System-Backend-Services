const { ActivityLog, StoreVisit, DealClick, EventAttendance } = require('../models/index');
const logger = require('../config/logger');

// ─── Internal Event Ingestion ─────────────────────────────────────
// Called by ALL other services via POST /api/internal/events

/**
 * POST /api/internal/events
 * Receives events from User Service, Operator Service, Mall API Service
 */
const receiveEvent = async (req, res, next) => {
  try {
    const { event_type, user_id, store_id, deal_id, event_id, store_name, event_name, ...rest } = req.body;

    // Always log to the general activity log
    await ActivityLog.create({ event_type, user_id, store_id, deal_id, event_id, metadata: rest });

    // Route to specific collection based on event type
    if (event_type === 'store_visit' && store_id) {
      await StoreVisit.create({ store_id, store_name: store_name || null, user_id: user_id || null });
    }
    if (event_type === 'deal_click' && deal_id) {
      await DealClick.create({ deal_id, store_id: store_id || '', user_id: user_id || null });
    }
    if (event_type === 'event_attendance' && event_id) {
      await EventAttendance.create({ event_id, event_name: event_name || null, user_id: user_id || null });
    }

    logger.info(`Analytics event received: ${event_type}`);
    res.status(201).json({ success: true, message: 'Event logged successfully' });
  } catch (err) { next(err); }
};

// ─── Store Visits CRUD ────────────────────────────────────────────

const getAllStoreVisits = async (req, res, next) => {
  try {
    const { store_id, user_id, from, to, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (store_id) filter.store_id = store_id;
    if (user_id)  filter.user_id  = user_id;
    if (from || to) {
      filter.visit_time = {};
      if (from) filter.visit_time.$gte = new Date(from);
      if (to)   filter.visit_time.$lte = new Date(to);
    }
    const total = await StoreVisit.countDocuments(filter);
    const visits = await StoreVisit.find(filter).sort({ visit_time: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ success: true, data: visits, pagination: { total, page: +page, limit: +limit } });
  } catch (err) { next(err); }
};

const createStoreVisit = async (req, res, next) => {
  try {
    const visit = await StoreVisit.create(req.body);
    res.status(201).json({ success: true, data: visit });
  } catch (err) { next(err); }
};

const deleteStoreVisit = async (req, res, next) => {
  try {
    const visit = await StoreVisit.findByIdAndDelete(req.params.id);
    if (!visit) return res.status(404).json({ success: false, message: 'Visit log not found' });
    res.json({ success: true, message: 'Visit log deleted' });
  } catch (err) { next(err); }
};

// ─── Deal Clicks CRUD ─────────────────────────────────────────────

const getAllDealClicks = async (req, res, next) => {
  try {
    const { deal_id, store_id, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (deal_id)  filter.deal_id  = deal_id;
    if (store_id) filter.store_id = store_id;
    const total = await DealClick.countDocuments(filter);
    const clicks = await DealClick.find(filter).sort({ click_time: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ success: true, data: clicks, pagination: { total, page: +page, limit: +limit } });
  } catch (err) { next(err); }
};

const createDealClick = async (req, res, next) => {
  try {
    const click = await DealClick.create(req.body);
    res.status(201).json({ success: true, data: click });
  } catch (err) { next(err); }
};

const deleteDealClick = async (req, res, next) => {
  try {
    const click = await DealClick.findByIdAndDelete(req.params.id);
    if (!click) return res.status(404).json({ success: false, message: 'Deal click log not found' });
    res.json({ success: true, message: 'Deal click log deleted' });
  } catch (err) { next(err); }
};

// ─── Event Attendance CRUD ────────────────────────────────────────

const getAllEventAttendance = async (req, res, next) => {
  try {
    const { event_id, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (event_id) filter.event_id = event_id;
    const total = await EventAttendance.countDocuments(filter);
    const records = await EventAttendance.find(filter).skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ success: true, data: records, pagination: { total } });
  } catch (err) { next(err); }
};

const createEventAttendance = async (req, res, next) => {
  try {
    const record = await EventAttendance.create(req.body);
    res.status(201).json({ success: true, data: record });
  } catch (err) { next(err); }
};

const deleteEventAttendance = async (req, res, next) => {
  try {
    const record = await EventAttendance.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Attendance record not found' });
    res.json({ success: true, message: 'Attendance record deleted' });
  } catch (err) { next(err); }
};

// ─── Analytics Reports (MongoDB Aggregation) ─────────────────────

/**
 * GET /api/analytics/popular-stores
 * Uses MongoDB $group to count visits per store
 */
const getPopularStores = async (req, res, next) => {
  try {
    const { days = 30, limit = 10 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const results = await StoreVisit.aggregate([
      { $match: { visit_time: { $gte: since } } },
      {
        $group: {
          _id: '$store_id',
          store_name:  { $first: '$store_name' },
          visit_count: { $sum: 1 },
        },
      },
      { $sort: { visit_count: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 0,
          store_id:    '$_id',
          store_name:  1,
          visit_count: 1,
        },
      },
    ]);

    res.json({ success: true, message: `Top ${limit} stores in last ${days} days`, data: results, period_days: parseInt(days) });
  } catch (err) { next(err); }
};

/**
 * GET /api/analytics/active-users
 * Most active shoppers by store visit count
 */
const getActiveUsers = async (req, res, next) => {
  try {
    const { days = 30, limit = 10 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const results = await StoreVisit.aggregate([
      { $match: { visit_time: { $gte: since }, user_id: { $ne: null } } },
      { $group: { _id: '$user_id', visit_count: { $sum: 1 } } },
      { $sort: { visit_count: -1 } },
      { $limit: parseInt(limit) },
      { $project: { _id: 0, user_id: '$_id', visit_count: 1 } },
    ]);

    res.json({ success: true, data: results, period_days: parseInt(days) });
  } catch (err) { next(err); }
};

/**
 * GET /api/analytics/event-attendance-stats
 * Top events by attendance count
 */
const getEventAttendanceStats = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const results = await EventAttendance.aggregate([
      {
        $group: {
          _id: '$event_id',
          event_name:      { $first: '$event_name' },
          total_attendees: { $sum: 1 },
        },
      },
      { $sort: { total_attendees: -1 } },
      { $limit: parseInt(limit) },
      { $project: { _id: 0, event_id: '$_id', event_name: 1, total_attendees: 1 } },
    ]);
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
};

/**
 * GET /api/analytics/popular-deals
 * Most clicked deals
 */
const getPopularDeals = async (req, res, next) => {
  try {
    const { days = 30, limit = 10 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const results = await DealClick.aggregate([
      { $match: { click_time: { $gte: since } } },
      {
        $group: {
          _id: '$deal_id',
          store_id:    { $first: '$store_id' },
          click_count: { $sum: 1 },
        },
      },
      { $sort: { click_count: -1 } },
      { $limit: parseInt(limit) },
      { $project: { _id: 0, deal_id: '$_id', store_id: 1, click_count: 1 } },
    ]);

    res.json({ success: true, data: results, period_days: parseInt(days) });
  } catch (err) { next(err); }
};

/**
 * GET /api/analytics/daily-footfall
 * Day-by-day visitor counts using $dateToString
 */
const getDailyFootfall = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const results = await StoreVisit.aggregate([
      { $match: { visit_time: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$visit_time' } },
          visit_count:     { $sum: 1 },
          unique_visitors: { $addToSet: '$user_id' },
        },
      },
      {
        $project: {
          _id: 0,
          date:            '$_id',
          visit_count:     1,
          unique_visitors: { $size: '$unique_visitors' },
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.json({ success: true, data: results, period_days: parseInt(days) });
  } catch (err) { next(err); }
};

/**
 * GET /api/analytics/summary
 * Dashboard: total counts across all collections
 */
const getSummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalVisits, todayVisits, monthVisits, totalDealClicks, totalEventAttendance, totalLogs] =
      await Promise.all([
        StoreVisit.countDocuments(),
        StoreVisit.countDocuments({ visit_time: { $gte: today } }),
        StoreVisit.countDocuments({ visit_time: { $gte: monthStart } }),
        DealClick.countDocuments(),
        EventAttendance.countDocuments(),
        ActivityLog.countDocuments(),
      ]);

    res.json({
      success: true,
      data: {
        store_visits:     { total: totalVisits, today: todayVisits, this_month: monthVisits },
        deal_clicks:      { total: totalDealClicks },
        event_attendance: { total: totalEventAttendance },
        activity_logs:    { total: totalLogs },
        generated_at:     new Date().toISOString(),
      },
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/analytics/logs
 * Raw activity log with filters
 */
const getActivityLogs = async (req, res, next) => {
  try {
    const { event_type, user_id, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (event_type) filter.event_type = event_type;
    if (user_id)    filter.user_id    = user_id;
    const total = await ActivityLog.countDocuments(filter);
    const logs  = await ActivityLog.find(filter).sort({ logged_at: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ success: true, data: logs, pagination: { total, page: +page, limit: +limit } });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/analytics/logs/:id
 */
const deleteActivityLog = async (req, res, next) => {
  try {
    const log = await ActivityLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'Log entry not found' });
    logger.info(`Activity log deleted: ${req.params.id}`);
    res.json({ success: true, message: 'Activity log deleted' });
  } catch (err) { next(err); }
};

module.exports = {
  receiveEvent,
  getAllStoreVisits, createStoreVisit, deleteStoreVisit,
  getAllDealClicks, createDealClick, deleteDealClick,
  getAllEventAttendance, createEventAttendance, deleteEventAttendance,
  getPopularStores, getActiveUsers, getEventAttendanceStats,
  getPopularDeals, getDailyFootfall, getSummary,
  getActivityLogs, deleteActivityLog,
};
