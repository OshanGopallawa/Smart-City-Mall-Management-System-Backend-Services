const axios = require('axios');
const Event = require('../models/Event');
const logger = require('../config/logger');

const notifyAnalytics = async (payload) => {
  try {
    await axios.post(`${process.env.ANALYTICS_SERVICE_URL}/api/internal/events`, payload,
      { headers: { 'x-api-key': process.env.INTERNAL_API_KEY }, timeout: 3000 });
  } catch (e) { logger.warn('Analytics notify failed:', e.message); }
};

/** GET /api/events */
const getAllEvents = async (req, res, next) => {
  try {
    const { event_type, upcoming_only = 'true', page = 1, limit = 20 } = req.query;
    const filter = { is_active: true };
    if (event_type) filter.event_type = event_type;
    if (upcoming_only === 'true') filter.end_time = { $gte: new Date() };

    const total = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .skip((page - 1) * limit).limit(parseInt(limit)).sort({ start_time: 1 });

    res.json({ success: true, data: events, pagination: { total, page: +page, limit: +limit } });
  } catch (err) { next(err); }
};

/** GET /api/events/:id */
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
};

/** POST /api/events */
const createEvent = async (req, res, next) => {
  try {
    const event = await Event.create({ ...req.body, created_by_operator: req.user?.id || null });
    await notifyAnalytics({ event_type: 'mall_event_created', event_id: event._id.toString(), event_name: event.name });
    logger.info(`Event created: ${event._id} — ${event.name}`);
    res.status(201).json({ success: true, message: 'Event created', data: event });
  } catch (err) { next(err); }
};

/** PUT /api/events/:id */
const updateEvent = async (req, res, next) => {
  try {
    const allowed = ['name', 'description', 'event_type', 'location_in_mall', 'start_time', 'end_time', 'max_capacity', 'is_free', 'ticket_price', 'image_url', 'is_active', 'tags'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const event = await Event.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    logger.info(`Event updated: ${event._id}`);
    res.json({ success: true, message: 'Event updated', data: event });
  } catch (err) { next(err); }
};

/** DELETE /api/events/:id — soft delete */
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, { is_active: false }, { new: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event cancelled' });
  } catch (err) { next(err); }
};

/** POST /api/events/:id/attend — internal, called by User/Analytics Service */
const recordAttendance = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.max_capacity && event.current_attendance >= event.max_capacity)
      return res.status(409).json({ success: false, message: 'Event at full capacity' });
    event.current_attendance += 1;
    await event.save();
    res.json({ success: true, message: 'Attendance recorded', data: { event_id: event._id, current_attendance: event.current_attendance } });
  } catch (err) { next(err); }
};

module.exports = { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent, recordAttendance };
