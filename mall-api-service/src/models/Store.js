const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  category: {
    type: String,
    required: true,
    enum: ['Fashion', 'Electronics', 'Food & Beverage', 'Entertainment', 'Health & Beauty', 'Sports', 'Books', 'Toys', 'Other'],
  },
  description: { type: String, default: null },
  floor: { type: String, required: true },
  unit_number: { type: String, required: true, unique: true },
  opening_hours: {
    type: Object,
    default: {
      monday: '09:00-21:00', tuesday: '09:00-21:00', wednesday: '09:00-21:00',
      thursday: '09:00-21:00', friday: '09:00-22:00', saturday: '10:00-22:00', sunday: '10:00-20:00',
    },
  },
  contact_phone: { type: String, default: null },
  contact_email: { type: String, default: null },
  logo_url: { type: String, default: null },
  is_active: { type: Boolean, default: true },
  operator_id: { type: String, default: null, comment: 'Reference to Operator Service operator _id' },
}, { timestamps: true });

storeSchema.index({ category: 1 });
storeSchema.index({ is_active: 1 });
storeSchema.index({ floor: 1 });
storeSchema.index({ operator_id: 1 });

module.exports = mongoose.model('Store', storeSchema);
