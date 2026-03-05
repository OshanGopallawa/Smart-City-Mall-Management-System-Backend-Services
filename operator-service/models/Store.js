const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String
  },
  floor: {
    type: String
  },
  description: {
    type: String
  },
  openingHours: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model("Store", storeSchema);