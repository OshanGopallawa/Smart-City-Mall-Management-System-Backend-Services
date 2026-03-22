const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const operatorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  phone: { type: String, default: null },
  role: {
    type: String,
    enum: ['store_manager', 'mall_admin', 'super_admin'],
    default: 'store_manager',
  },
  store_id: {
    type: String,
    default: null,
    comment: 'Reference to Mall API Service store _id',
  },
  store_name: { type: String, default: null },
  permissions: {
    type: [String],
    default: ['manage_deals', 'manage_events'],
  },
  is_active: { type: Boolean, default: true },
  last_login: { type: Date, default: null },
  refresh_token: { type: String, default: null },
}, { timestamps: true });

operatorSchema.index({ email: 1 });
operatorSchema.index({ role: 1 });
operatorSchema.index({ store_id: 1 });
operatorSchema.index({ is_active: 1 });

operatorSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.password_hash);
};

operatorSchema.methods.toSafeJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.password_hash;
  delete obj.refresh_token;
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Operator', operatorSchema);
