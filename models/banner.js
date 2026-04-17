const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: false
    },
    desc: {
      type: String
    },
  images: {
  type: [String],   // ✅ ARRAY
  required: true
    },
  type: {
  type: String,
  enum: ['home','side-banner','category', 'offer'],
  default: 'home'
},
   
    status: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banner", bannerSchema);