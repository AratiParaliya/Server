const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { Payment } = require("../models/payment");
const Order = require("../models/order");
// 🔐 Razorpay instance
const razorpay = new Razorpay({
  key_id: "rzp_test_SeyW9kHlwo6iis",
  key_secret: "0JLjOga5bxzdIfUsde0WJfPW"
});


// ✅ 1. CREATE ORDER
router.post("/create-order", async (req, res) => {
  try {
    const { amount, userId } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Amount is required"
      });
    }

    // ✅ FIXED: use amount directly (NOT order.totalPrice)
    const options = {
      amount: amount * 100, // 🔥 convert to paisa
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: userId
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // ✅ SAVE PAYMENT (Pending)
    const payment = new Payment({
      userId,
      razorpay_order_id: razorpayOrder.id,
      amount,
      paymentMethod: "UPI",
      status: "Pending"
    });

    await payment.save();

    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      paymentId: payment._id
    });

  } catch (err) {
    console.log("CREATE ORDER ERROR:", err); // 🔥 ADD THIS
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});


// ✅ 2. VERIFY PAYMENT
router.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId // 🔥 from frontend
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", "0JLjOga5bxzdIfUsde0WJfPW")
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      // ❌ FAILED
      await Payment.findByIdAndUpdate(paymentId, {
        status: "Failed"
      });

      return res.status(400).json({ success: false });
    }

    // ✅ SUCCESS
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        razorpay_payment_id,
        razorpay_signature,
        status: "Paid"
      },
      { new: true }
    );

    res.json({
      success: true,
      payment
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ✅ GET ALL PAYMENTS (FIX 404)
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    // ✅ ONLY PAID PAYMENTS COUNT
    const total = await Payment.countDocuments({ status: "Paid" });

    const payments = await Payment.find({ status: "Paid" }) // ✅ FILTER HERE
      .populate("userId", "name")
      .populate("orderId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // ✅ TOTAL AMOUNT (ONLY PAID)
    const totalAmountAgg = await Payment.aggregate([
      { $match: { status: "Paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    res.json({
      success: true,
      payments,
      total,
      totalAmount: totalAmountAgg[0]?.total || 0,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ DELETE PAYMENT
router.delete("/delete/:id", async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;