const mongoose = require('mongoose');

const storeVisitSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  store_id: { type: String, required: true },
  store_name: { type: String, default: null },
  visited_at: { type: Date, default: Date.now },
}, { timestamps: false });

storeVisitSchema.index({ user_id: 1 });
storeVisitSchema.index({ store_id: 1 });
storeVisitSchema.index({ visited_at: -1 });

module.exports = mongoose.model('StoreVisit', storeVisitSchema);
