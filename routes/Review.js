
const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const mongoose = require("mongoose");
const Order = require("../models/order");
const fs = require("fs");
const { Product } = require("../models/product");


const multer = require("multer");

const uploadDir = "uploads/reviews";

// ✅ Create folder if not exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Multer config (OUTSIDE if block)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });
const updateProductRating = async (productId) => {
  const reviews = await Review.find({ productId });

  const numReviews = reviews.length;

 const avgRating =
  numReviews === 0
    ? 0
    : Math.round(
        (reviews.reduce((sum, item) => sum + item.rating, 0) / numReviews) * 10
      ) / 10;

  await Product.findByIdAndUpdate(productId, {
    rating: avgRating,
    numReviews: numReviews
  });
};
router.post("/add", upload.array("images"), async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    const { userId, productId, orderId, rating, reviewText } = req.body;

    const existing = await Review.findOne({ userId, productId, orderId });

    if (existing) {
      return res.status(400).json({ msg: "Already reviewed!" });
    }
const imagePaths = req.files?.map(file => 
  `${req.protocol}://${req.get("host")}/${file.path}`
) || [];

    const review = new Review({
      userId,
      productId,
      orderId,
      rating: Number(rating),
      reviewText,
      images: imagePaths
    });

    await review.save();
await updateProductRating(productId);
    res.json({ success: true, review });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/rating-summary/:productId", async (req, res) => {
  const productId = req.params.productId;

  const stats = await Review.aggregate([
    { $match: { productId: mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 }
      }
    }
  ]);

  res.json(stats);
});
router.get("/product/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({
      productId: req.params.productId
    }).populate("userId", "name image");

    res.json({ reviews });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/can-review", async (req, res) => {
  try {
    const { userId, productId } = req.query;

    const order = await Order.findOne({
      userId,
      "orderItems.productId": productId,
      status: "Delivered"
    });

    if (!order) {
      return res.json({ canReview: false });
    }

    const alreadyReviewed = await Review.findOne({
      userId,
      productId,
      orderId: order._id
    });

    res.json({
      canReview: !alreadyReviewed,
      orderId: order._id
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/user-review", async (req, res) => {
  try {
    const { userId, productId, orderId } = req.query;

    const review = await Review.findOne({
      userId,
      productId,
      orderId
    });

    res.json({ review });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;   // current page
    const limit = parseInt(req.query.limit) || 10; // items per page

    const skip = (page - 1) * limit;

    const total = await Review.countDocuments();

    const reviews = await Review.find()
      .populate("userId", "name")
      .populate("productId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.put("/update/:id", upload.array("images"), async (req, res) => {
  try {
    const { rating, reviewText } = req.body;

    let updatedData = {
      rating,
      reviewText
    };

    // ✅ if new images uploaded
    if (req.files && req.files.length > 0) {
     updatedData.images = req.files.map(file => 
  `${req.protocol}://${req.get("host")}/${file.path}`
);
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );
await updateProductRating(review.productId);
    res.json({ success: true, review });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.delete("/delete/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // ✅ store productId BEFORE delete
    const productId = review.productId;

    // ✅ Delete images
    if (review.images && review.images.length > 0) {
     review.images.forEach((img) => {
  const filePath = img.replace(
    `${req.protocol}://${req.get("host")}/`,
    ""
  );

  fs.unlink(filePath, (err) => {
    if (err) console.log("Delete error:", err);
  });
});
    }

    await Review.findByIdAndDelete(req.params.id);

    // ✅ NOW update rating
    await updateProductRating(productId);

    res.json({ success: true, message: "Deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/reply/:reviewId", async (req, res) => {
  try {
    console.log("BODY:", req.body); // 👈 ADD THIS


   const { userId, userName, text, userImage } = req.body;

    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ msg: "Review not found" });
    }


review.replies.push({
  userId,
  userName,
  text,
  userImage  
});

    await review.save();

    res.json({ success: true, review });

  } catch (err) {
    console.log("ERROR:", err); // 👈 ADD THIS
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;