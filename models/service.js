const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  icon: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String },
  bg: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Service", serviceSchema);