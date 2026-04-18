const express = require("express");
const router = express.Router();
const Banner = require("../models/banner");





const pLimit = require('p-limit');


// ✅ CREATE BANNER
router.post("/", async (req, res) => {
  try {
  if (!req.body.images || req.body.images.length === 0) {
  return res.status(400).json({
    success: false,
    msg: "Images required"
  });
}

 const banner = new Banner({
  title: req.body.title,
  desc: req.body.desc,
  type: req.body.type,   // ✅ ADD THIS
  status: req.body.status,
  images: req.body.images
});

    await banner.save();

    res.json({
      success: true,
      msg: "Banner created",
      data: banner
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
});



// ✅ GET ALL BANNERS
router.get("/", async (req, res) => {
  try {
    const { type, status, page = 1, limit = 10 } = req.query;

    let filter = {};

    // ✅ Filter by type
    if (type) {
      filter.type = type;
    }

    // ✅ Filter by status
    if (status !== undefined) {
      filter.status = status === "true";
    }

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);

    const total = await Banner.countDocuments(filter);

    const banners = await Banner.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)   // 🔥 pagination logic
      .limit(pageSize);

    res.json({
      success: true,
      data: banners,
      page: pageNumber,
      totalPages: Math.ceil(total / pageSize),
      totalItems: total
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
});


// ✅ GET SINGLE BANNER
router.get("/:id", async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    res.json({
      success: true,
      data: banner
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
});


// ✅ UPDATE BANNER
router.put("/:id", async (req, res) => {
  try {

const updateData = {
  title: req.body.title,
  desc: req.body.desc,
  type: req.body.type,   // ✅ ADD THIS
  status: req.body.status,
  images: req.body.images
};

    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      msg: "Banner updated",
      data: banner
    });

  } catch (err) {
    console.log("UPDATE ERROR:", err);
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
});


// ✅ DELETE BANNER
router.delete("/:id", async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      msg: "Banner deleted"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
});

module.exports = router;