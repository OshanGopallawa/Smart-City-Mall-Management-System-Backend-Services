const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, required: true },
  event_type: {
    type: String,
    required: true,
    enum: ['sale', 'entertainment', 'exhibition', 'food_festival', 'kids_event', 'seasonal', 'other'],
  },
  location_in_mall: { type: String, required: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  max_capacity: { type: Number, default: null },
  current_attendance: { type: Number, default: 0 },
  is_free: { type: Boolean, default: true },
  ticket_price: { type: Number, default: null },
  image_url: { type: String, default: null },
  is_active: { type: Boolean, default: true },
  organizer_store_id: { type: String, default: null },
  created_by_operator: { type: String, default: null },
  tags: { type: [String], default: [] },
}, { timestamps: true });

eventSchema.index({ event_type: 1 });
eventSchema.index({ start_time: 1 });
eventSchema.index({ is_active: 1 });

module.exports = mongoose.model('Event', eventSchema);
