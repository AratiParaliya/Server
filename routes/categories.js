
require('dotenv').config();
const { SubCategory } = require('../models/subcategory');
const { Category } = require('../models/category');
const { Product } = require('../models/product');
const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require("path");










// ================= GET =================
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const totalCategories = await Category.countDocuments();

    const categories = await Category.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      categories,              // ✅ IMPORTANT
      totalCategories,
      totalPages: Math.ceil(totalCategories / limit),
      page
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/all', async (req, res) => {
  const categories = await Category.find().sort({ _id: -1 });
  res.json(categories);
});
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      res.status(500).json({ message : 'The category with the given ID was not found.'});
    }

   return res.status(200).send(category);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;

    // ✅ 1. Delete category
    const deletedCategory = await Category.findByIdAndDelete(categoryId);

    if (!deletedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    // ✅ 2. Delete subcategories of this category
    await SubCategory.deleteMany({ category: categoryId });

    // ✅ 3. Delete products of this category
    await Product.deleteMany({ category: categoryId });

    res.status(200).json({
      success: true,
      message: "Category, SubCategories, and Products deleted successfully"
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/:id', async (req, res) => {
  try {

    let images = [];

    if (Array.isArray(req.body.images)) {
      images = req.body.images;
    } else {
      images = [req.body.images];
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        images: images,   // ✅ DIRECT SAVE
        color: req.body.color
      },
      { new: true }
    );

    res.json({
      success: true,
      data: category
    });

  } catch (error) {
    console.log("UPDATE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Category update failed"
    });
  }
});

// ================= CREATE =================
const pLimit = require('p-limit');

router.post('/create', async (req, res) => {
  try {

    if (!req.body.images || req.body.images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Images required"
      });
    }

    const category = new Category({
      name: req.body.name,
      images: req.body.images,   // ✅ DIRECT SAVE
      color: req.body.color
    });

    const savedCategory = await category.save();

    res.status(201).json({
      success: true,
      data: savedCategory
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;