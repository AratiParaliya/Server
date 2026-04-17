const express = require('express');
const router = express.Router();
const { Order } = require('../models/order');
const { User } = require('../models/user');
const { Product } = require('../models/product');

const sendInvoiceEmail = require("../utils/sendInvoice");
router.post('/create', async (req, res) => {
  try {
    const {
      userId,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
      isPaid,
      paymentId
    } = req.body;

    // ✅ Save address in user
    await User.findByIdAndUpdate(userId, {
      firstName: shippingAddress.firstName,
      lastName: shippingAddress.lastName,
      address1: shippingAddress.address1,
      address2: shippingAddress.address2,
      city: shippingAddress.city,
      state: shippingAddress.state,
      zipCode: shippingAddress.zipCode,
      country: shippingAddress.country,
      phone: shippingAddress.phone
    });

    // ✅ Create order
    const order = new Order({
      userId,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
      isPaid: isPaid || false,
      paymentId,
      status: "Ordered",
      trackingHistory: [
        { status: "Ordered", date: new Date() }
      ]
    });

    
    const savedOrder = await order.save();

  

    for (let item of orderItems) {
  await Product.findByIdAndUpdate(item.productId, {
    $inc: {
      totalOrder: item.quantity,
      totalSales: item.quantity * item.price,
      countInStock: -item.quantity // 🔥 reduce stock
    }
  });
    }
    
    const user = await User.findById(userId);

if (user?.email) {
  sendInvoiceEmail(user.email, {
  orderId: savedOrder._id,
  items: orderItems,
  billingDetails: shippingAddress,
  paymentMethod,
  amountPaid: totalPrice
}).catch(err => console.log("Email error:", err));
}

    res.status(201).json({
      success: true,
      order: savedOrder
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all orders
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    // ✅ Total Orders
    const totalOrders = await Order.countDocuments();

    // ✅ Total Revenue (ALL ORDERS)
    const revenueData = await Order.aggregate([
      {
        $match: { isPaid: true } // ✅ ONLY PAID (IMPORTANT)
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" }
        }
      }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    // ✅ Paginated Orders
    const orders = await Order.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      orders,
      totalOrders,
      totalRevenue, // ✅ RETURN THIS
      totalPages: Math.ceil(totalOrders / limit),
      page
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// GET orders of a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
                              .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// GET single order
router.get('/:id', async (req, res) => {
  try {
   const order = await Order.findById(req.params.id)
  .populate({
    path: "userId",
    select: "name email"
  });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      order
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// DELETE order
router.delete('/:id', async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      message: "Order deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE ORDER STATUS + PAYMENT
router.put('/:id', async (req, res) => {
  try {
    const { status, isPaid } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        msg: "Order not found"
      });
    }

    // ✅ update fields
    order.status = status;
    order.isPaid = isPaid;

    // ✅ add tracking history
    order.trackingHistory.push({
      status: status,
      date: new Date()
    });

    await order.save();

    res.json({
      success: true,
      msg: "Order updated successfully",
      order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
router.put("/update-address/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        msg: "Order not found"
      });
    }

    // ⏱️ TIME CHECK
    const orderTime = order.dateCreated;
    const now = new Date();
    const diffInHours = (now - orderTime) / (1000 * 60 * 60);

    if (diffInHours > 24 || order.status === "Shipped") {
      return res.status(400).json({
        success: false,
        msg: "Address cannot be updated after 24 hours or once shipped"
      });
    }

    // ✅ UPDATE ORDER ADDRESS
    order.shippingAddress = req.body;
    await order.save();

    // ✅ UPDATE USER ADDRESS ALSO 🔥
    await User.findByIdAndUpdate(order.userId, {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      address1: req.body.address1,
      address2: req.body.address2,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode,
      country: req.body.country,
      phone: req.body.phone
    });

    res.json({
      success: true,
      msg: "Address updated in order & user",
      order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.put("/cancel/:id", async (req, res) => {
  try {
    const { reason, note } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, msg: "Order not found" });
    }

    if (!["pending", "ordered"].includes(order.status.toLowerCase())) {
      return res.json({ success: false, msg: "Cannot cancel now" });
    }

    // ✅ Update status
    order.status = "Cancelled";

    order.cancelDetails = {
      reason,
      note,
      cancelledAt: new Date()
    };

    // 🔥 NEW: Handle refund if paid
    if (order.isPaid) {
      order.refundDetails = {
        amount: order.totalPrice,
        status: "Pending",
        refundedAt: new Date()
      };
    }

    await order.save();

    // 🔄 Restore product data
    for (let item of order.orderItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: {
          totalOrder: -item.quantity,
          totalSales: -(item.quantity * item.price),
          countInStock: item.quantity
        }
      });
    }

    res.json({
      success: true,
      msg: order.isPaid
        ? `Order cancelled. Refund of ₹${order.totalPrice} will be processed.`
        : "Order cancelled successfully"
    });

  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});


const crypto = require("crypto");

router.get("/update-order/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.send("Order not found");

    order.isPaid = true;
    order.status = "Paid";

    order.trackingHistory.push({
      status: "Paid",
      date: new Date()
    });

    await order.save();

    res.send(`
      <h2>✅ Payment Successful</h2>
      <p>Order marked as PAID</p>
    `);

  } catch (err) {
    res.send("Error updating order");
  }
});
router.get("/scan/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).send("Order not found");

    // Increment scan count
    order.scanCount = (order.scanCount || 0) + 1;

    // Update status based on scan count
    if (order.scanCount === 1) {
      order.status = "Shipping";
    } else if (order.scanCount === 2) {
      order.status = "Out for Delivery";
    } else if (order.scanCount >= 3) {
      order.status = "Delivered";
    }

    await order.save();

    res.send(`
      <h2>Order Updated</h2>
      <p>Status: ${order.status}</p>
    `);
  } catch (err) {
    res.status(500).send("Error updating order");
  }
});

module.exports = router;