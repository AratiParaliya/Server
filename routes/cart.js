const { Cart } = require("../models/cart");
const { Product } = require("../models/product");
const {user } = require("../models/user");
const mongoose = require("mongoose");
const express = require('express');
const router = express.Router();

// POST /api/cart/add
router.post("/add", async (req, res) => {
  const { userId, productId, quantity, variant, variantType } = req.body;

  try {
    let cart = await Cart.findOne({ user: userId });

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    if (!cart) {
      cart = new Cart({
        user: userId,
        items: []
      });
    }

    // ✅ CHECK SAME PRODUCT + SAME VARIANT
    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === productId &&
        item.variant === variant
    );

    if (existingItem) {
      // 🔥 INCREASE QUANTITY
      existingItem.quantity += quantity;
    } else {
      // ✅ ADD NEW ITEM
      cart.items.push({
        product: productId,
        price: product.price,
        quantity,
        variant,
        variantType
      });
    }

    // ✅ UPDATE TOTALS
    cart.totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);

    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    await cart.save();

    res.json(cart);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/cart/:userId
router.get("/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId })
      .populate("items.product");

    if (!cart) {
      return res.json({
        items: [],
        totalItems: 0,
        totalPrice: 0
      });
    }

    res.json(cart);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/cart/update
router.put("/update", async (req, res) => {
  const { userId, productId, variant, action } = req.body;

  try {
    const cart = await Cart.findOne({ user: userId });

    const item = cart.items.find(
      (i) =>
        i.product.toString() === productId &&
        i.variant === variant
    );

    if (!item) return res.status(404).json({ msg: "Item not found" });

    if (action === "inc") item.quantity += 1;
    if (action === "dec" && item.quantity > 1) item.quantity -= 1;

    // update totals
    cart.totalItems = cart.items.reduce((a, i) => a + i.quantity, 0);
    cart.totalPrice = cart.items.reduce(
      (a, i) => a + i.price * i.quantity,
      0
    );

    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/cart/remove
router.delete("/remove", async (req, res) => {
  const { userId, productId, variant } = req.body;

  try {
    const cart = await Cart.findOne({ user: userId });

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product.toString() === productId &&
          item.variant === variant
        )
    );

    // update totals
    cart.totalItems = cart.items.reduce((a, i) => a + i.quantity, 0);
    cart.totalPrice = cart.items.reduce(
      (a, i) => a + i.price * i.quantity,
      0
    );

    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/cart/clear/:userId
router.delete("/clear/:userId", async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.params.userId });
    res.json({ msg: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;