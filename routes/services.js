const express = require("express");
const router = express.Router();
const Service = require("../models/service");


// ✅ CREATE SERVICE
router.post("/", async (req, res) => {
  try {
    const { icon, title, subtitle, bg } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        msg: "Title is required"
      });
    }

    const service = new Service({
      icon,
      title,
      subtitle,
      bg
    });

    await service.save();

    res.json({
      success: true,
      msg: "Service created",
      data: service
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
});


// ✅ GET ALL SERVICES
router.get("/", async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: services
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
});


// ✅ GET SINGLE SERVICE
router.get("/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    res.json({
      success: true,
      data: service
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
});


// ✅ UPDATE SERVICE
router.put("/:id", async (req, res) => {
  try {
    const updated = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      msg: "Service updated",
      data: updated
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
});


// ✅ DELETE SERVICE
router.delete("/:id", async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      msg: "Service deleted"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
});

module.exports = router;