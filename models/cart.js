const mongoose = require("mongoose");

const cartItemSchema = mongoose.Schema({
    product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
    price: {
        type: Number,
         default:0
    },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },

  // ✅ store selected variant (important)
  variant: {
    type: String, // e.g. "M", "Black", "8GB", "1kg"
    default: null
  },

  // ✅ optional (for flexibility)
  variantType: {
    type: String, // "Size", "Color", "RAM", "Weight"
    default: null
  }
});

const cartSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  items: [cartItemSchema], // 🔥 multiple products

  totalPrice: {
    type: Number,
    default: 0
  },

  totalItems: {
    type: Number,
    default: 0
  },

  dateCreated: {
    type: Date,
    default: Date.now
  }
});

exports.Cart = mongoose.model("Cart", cartSchema);