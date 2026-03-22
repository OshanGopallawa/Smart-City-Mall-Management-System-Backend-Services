const mongoose = require('mongoose');

// ── ActivityLog — general event log from ALL services ──────────────
const activityLogSchema = new mongoose.Schema({
  event_type: {
    type: String,
    required: true,
    enum: [
      'user_registered', 'user_login', 'store_visit', 'deal_created',
      'store_created', 'mall_event_created', 'event_attendance', 'deal_click',
    ],
  },
  user_id:  { type: String, default: null },
  store_id: { type: String, default: null },
  deal_id:  { type: String, default: null },
  event_id: { type: String, default: null },
  metadata: { type: Object, default: {} },
  logged_at: { type: Date, default: Date.now },
}, { timestamps: false });

activityLogSchema.index({ event_type: 1 });
activityLogSchema.index({ logged_at: -1 });
activityLogSchema.index({ user_id: 1 });

// ── StoreVisit ─────────────────────────────────────────────────────
const storeVisitSchema = new mongoose.Schema({
  store_id:   { type: String, required: true },
  store_name: { type: String, default: null },
  user_id:    { type: String, default: null },
  visit_time: { type: Date, default: Date.now },
  source: {
    type: String,
    enum: ['direct', 'search', 'deal_click', 'event', 'recommendation'],
    default: 'direct',
  },
}, { timestamps: false });

storeVisitSchema.index({ store_id: 1 });
storeVisitSchema.index({ user_id: 1 });
storeVisitSchema.index({ visit_time: -1 });

// ── DealClick ──────────────────────────────────────────────────────
const dealClickSchema = new mongoose.Schema({
  deal_id:       { type: String, required: true },
  store_id:      { type: String, required: true },
  user_id:       { type: String, default: null },
  click_time:    { type: Date, default: Date.now },
  discount_type: { type: String, default: null },
}, { timestamps: false });

dealClickSchema.index({ deal_id: 1 });
dealClickSchema.index({ store_id: 1 });
dealClickSchema.index({ click_time: -1 });

// ── EventAttendance ────────────────────────────────────────────────
const eventAttendanceSchema = new mongoose.Schema({
  event_id:      { type: String, required: true },
  event_name:    { type: String, default: null },
  user_id:       { type: String, default: null },
  registered_at: { type: Date, default: Date.now },
  attended:      { type: Boolean, default: false },
}, { timestamps: false });

eventAttendanceSchema.index({ event_id: 1 });
eventAttendanceSchema.index({ user_id: 1 });

module.exports = {
  ActivityLog:     mongoose.model('ActivityLog',     activityLogSchema),
  StoreVisit:      mongoose.model('StoreVisit',      storeVisitSchema),
  DealClick:       mongoose.model('DealClick',       dealClickSchema),
  EventAttendance: mongoose.model('EventAttendance', eventAttendanceSchema),
};
