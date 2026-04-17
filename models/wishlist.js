import mongoose from "mongoose";

const wishlistItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },

  
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  items: [wishlistItemSchema],

  totalItems: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export const Wishlist = mongoose.model("Wishlist", wishlistSchema);