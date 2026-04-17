const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
   required: true
  },

  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
    required: false
  },

  receiptNumber: {
    type: String,
    unique: true
  },

  items: [
    {
      name: String,
      quantity: Number,
      price: Number
    }
  ],

  billingDetails: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address1: String,
    address2: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },

  paymentMethod: {
    type: String,
    enum: ["COD", "UPI", "CHECK"]
  },

  amountPaid: Number,

  paymentStatus: {
    type: String,
    enum: ["Paid", "Pending"],
    default: "Paid"
  },

  issuedAt: {
    type: Date,
    default: Date.now
  }

});

exports.Receipt = mongoose.model("Receipt", receiptSchema);