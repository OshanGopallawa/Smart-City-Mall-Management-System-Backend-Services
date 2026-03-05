const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store"
  },
  title: String,
  discount: String,
  startDate: Date,
  endDate: Date
}, { timestamps: true });

module.exports = mongoose.model("Promotion", promotionSchema);