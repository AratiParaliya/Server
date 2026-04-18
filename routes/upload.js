const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// 🔹 Cloudinary Config
cloudinary.config({
  cloud_name: process.env.cloudinary_Config_cloud_name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
});

// 🔹 Multer Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// 🔹 Upload API
router.post('/', upload.array("images"), async (req, res) => {
  try {
    const imagesArr = [];

    for (let file of req.files) {
      const result = await cloudinary.uploader.upload(file.path);
      imagesArr.push(result.secure_url);
    }

    return res.status(200).json({
      success: true,
      images: imagesArr
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;