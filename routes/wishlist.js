const { Cart } = require("../models/cart");
const { Product } = require("../models/product");
const { Wishlist } = require("../models/wishlist");
const {user } = require("../models/user");
const mongoose = require("mongoose");
const express = require('express');
const router = express.Router();



// POST /api/wishlist/add
router.post("/add", async (req, res) => {
  try {
    const { userId, productId } = req.body;

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      wishlist = new Wishlist({
        user: userId,
        items: []
      });
    }

    const exists = wishlist.items.find((item) => {
      const itemId = item.product.toString();
      return itemId === productId;
    });

    if (!exists) {
      wishlist.items.push({
        product: productId
      });
    }

    wishlist.totalItems = wishlist.items.length;

    await wishlist.save();

    res.json(wishlist);
  } catch (error) {
    console.log("ADD ERROR:", error); // 🔥 IMPORTANT
    res.status(500).json({ error: error.message });
  }
});
// GET /api/wishlist/:userId
router.get("/:userId", async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.params.userId })
      .populate("items.product");

    if (!wishlist) {
      return res.json({ items: [], totalItems: 0 });
    }

    res.json(wishlist);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// DELETE /api/wishlist/remove
router.delete("/remove", async (req, res) => {
  try {
    const { userId, productId } = req.body;

    console.log("REMOVE BODY:", req.body); // ✅ debug

    const wishlist = await Wishlist.findOne({ user: userId });

    // ✅ FIX 1: check if wishlist exists
    if (!wishlist) {
      return res.status(404).json({ msg: "Wishlist not found" });
    }

    // ✅ FIX 2: safe filtering
    wishlist.items = wishlist.items.filter((item) => {
      const itemId = item.product?._id
        ? item.product._id.toString()
        : item.product.toString();

      return itemId !== productId.toString();
    });

    wishlist.totalItems = wishlist.items.length;

    await wishlist.save();

    res.json({
      success: true,
      items: wishlist.items
    });

  } catch (error) {
    console.log("🔥 REMOVE ERROR:", error); // ✅ VERY IMPORTANT
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});
module.exports = router;