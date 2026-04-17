const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },

  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },

  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },

  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },

  reviewText: {
    type: String,
    required: true,
    trim: true
  },

  // ✅ NEW: Images (Flipkart style)
  images: [
    {
      type: String
    }
  ],

  // ✅ NEW: Verified Purchase
  verified: {
    type: Boolean,
    default: true
  },

  // ✅ NEW: Helpful / Likes (future feature)
  helpfulCount: {
    type: Number,
    default: 0
  },

  // ✅ NEW: For edit tracking
  isEdited: {
    type: Boolean,
    default: false
  },

replies: [
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName: String,
    userImage: String, // ✅ ADD THIS
    text: String,
    createdAt: { type: Date, default: Date.now }
  }
]

}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);