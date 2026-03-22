const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  phone: { type: String, default: null },
  date_of_birth: { type: Date, default: null },
  membership_level: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze',
  },
  membership_points: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  is_active: { type: Boolean, default: true },
  is_email_verified: { type: Boolean, default: false },
  last_login: { type: Date, default: null },
  refresh_token: { type: String, default: null },
}, { timestamps: true });

userSchema.index({ email: 1 });
userSchema.index({ membership_level: 1 });
userSchema.index({ is_active: 1 });

userSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.password_hash);
};

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.password_hash;
  delete obj.refresh_token;
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
