const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  store_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  title: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, required: true },
  discount_type: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed', 'buy_x_get_y', 'bundle'],
  },
  discount_value: { type: Number, required: true, min: 0 },
  original_price: { type: Number, default: null },
  valid_from: { type: Date, default: Date.now },
  valid_until: { type: Date, required: true },
  terms_conditions: { type: String, default: null },
  image_url: { type: String, default: null },
  is_active: { type: Boolean, default: true },
  created_by_operator: { type: String, default: null },
}, { timestamps: true });

dealSchema.index({ store_id: 1 });
dealSchema.index({ valid_until: 1 });
dealSchema.index({ is_active: 1 });

module.exports = mongoose.model('Deal', dealSchema);
