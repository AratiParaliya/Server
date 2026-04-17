const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  orderItems: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      name: String,
      quantity: Number,
      price: Number,
      image: String
    }
  ],

  shippingAddress: {
    firstName: String,
    lastName: String,
    address1: String,
    address2: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },
  paymentId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Payment'
},
cancelDetails: {
  reason: String,
  note: String,
  cancelledAt: Date
},

refundDetails: {
  amount: Number,
  status: {
    type: String,
    enum: ["Pending", "Processed"],
    default: "Pending"
  },
  refundedAt: Date
},
 paymentMethod: {
  type: String,
  enum: ["COD", "UPI", "CHECK"], 
  default: "COD"
},
  scanCount: {
    type: Number,
    default: 0
  },
  itemsPrice: Number,
  shippingPrice: Number,
  totalPrice: Number,

isPaid: {
  type: Boolean,
  default: false
},

 trackingHistory: [
  {
    status: String,
    date: { type: Date, default: Date.now }
  }
],
status: {
  type: String,
  enum: [
    "Pending",
    "Ordered",
    "Processing",
    "Shipped",
    "Out for Delivery",
    "Delivered",
    "Cancelled"
  ],
  default: "Pending"
},

  dateCreated: {
    type: Date,
    default: Date.now
  },
  cancelDetails: {
  reason: String,
  note: String,
  cancelledAt: Date
}

});


exports.Order = mongoose.model('Order', orderSchema);