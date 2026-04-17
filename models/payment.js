const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },

  razorpay_order_id: String,
  razorpay_payment_id: String,
  razorpay_signature: String,

  paymentMethod: {
    type: String,
    enum: ["COD", "UPI", "CHECK"],
    required: true
  },

  amount: Number,

  status: {
    type: String,
    enum: ["Pending", "Paid", "Failed"],
    default: "Pending"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

exports.Payment = mongoose.model('Payment', paymentSchema);