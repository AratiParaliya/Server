const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  icon: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String },
  bg: { type: String },
  status: { type: Boolean, default: true } // ✅ ADD THIS
}, { timestamps: true });

module.exports = mongoose.model("Service", serviceSchema);