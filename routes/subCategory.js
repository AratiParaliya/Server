
require('dotenv').config();
const { SubCategory } = require('../models/subcategory');
const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require("path");
const mongoose = require("mongoose");

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_cloud_name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
});


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });
router.post('/upload', upload.array('images'), async (req, res) => {
  try {
    const imagesArr = [];

    for (let file of req.files) {
      const result = await cloudinary.uploader.upload(file.path);
      imagesArr.push(result.secure_url);
    }

    res.status(200).json({
      images: imagesArr
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Image upload failed"
    });
  }
});


// ================= CREATE =================
const pLimit = require('p-limit');

router.post('/create', async (req, res) => {
  try {

    const { name, images, category } = req.body;

    if (!name || !images || images.length === 0 || !category) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const subcategory = new SubCategory({
      name,
      images,
      category
    });

    const saved = await subcategory.save();

    res.status(201).json(saved);

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
router.get('/all', async (req, res) => {
  try {
    const subcategories = await SubCategory.find().populate("category");

    res.status(200).json(subcategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get('/', async (req, res) => {
  try {
    const categoryId = req.query.category;
    const page = parseInt(req.query.page) || 1;
    const perPage = 10;

    let filter = {};

    // ✅ APPLY CATEGORY FILTER
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      filter.category = new mongoose.Types.ObjectId(categoryId);
    }

    const totalPosts = await SubCategory.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / perPage);

    if (page > totalPages) {
      return res.status(404).json({
        message: "Page not found"
      });
    }

    const subcategoryList = await SubCategory.find(filter)
      .populate("category")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();

    return res.status(200).json({
      subcategoryList,
      totalPages,
      page
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
   const subcategory = await SubCategory
  .findById(req.params.id)
  .populate("category"); // optional but useful

    if (!subcategory) {
      res.status(500).json({ message : 'The subcategory with the given ID was not found.'});
    }

   return res.status(200).send(subcategory);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {

      const deletedSubCategory = await SubCategory.findByIdAndDelete(req.params.id);

  if (!deletedSubCategory) {
     res.status(400).json({ success: false, message : 'SubCategory not find!' });

  }
       res.status(200).json({ success: true, message : 'SubCategory Deleted!' });


  
});

router.put('/:id', async (req, res) => {
  try {

    const { name, category } = req.body;

    // ✅ CHECK DUPLICATE (exclude current id)
    const existing = await SubCategory.findOne({
      name: name.trim().toLowerCase(),
      category: category,
      _id: { $ne: req.params.id }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "SubCategory already exists in this category ❌"
      });
    }
    let images = [];

    if (Array.isArray(req.body.images)) {
      images = req.body.images;
    } else {
      images = [req.body.images];
    }

    const uploadedImages = [];

    for (let img of images) {

      // if img is array take first value
      if (Array.isArray(img)) {
        img = img[0];
      }

      if (typeof img === "string" && img.startsWith("http")) {
        uploadedImages.push(img);
      } else {
        const result = await cloudinary.uploader.upload(img);
        uploadedImages.push(result.secure_url);
      }

    }

    const subcategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        images: uploadedImages,
        category: req.body.category
      },
      { new: true }
    );

    res.json(subcategory);

  } catch (error) {

    console.log("UPDATE ERROR:", error);

    res.status(500).json({
      message: "Category update failed",
      success: false
    });

  }
});



module.exports = router;