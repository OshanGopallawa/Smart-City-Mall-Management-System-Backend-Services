const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  name: String,
  description: String,
  eventDate: Date,
  location: String
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);