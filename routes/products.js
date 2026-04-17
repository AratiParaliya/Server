const express = require('express');
const router = express.Router();
const mongoose = require("mongoose");
const { Product } = require('../models/product');
const { Category } = require('../models/category');
const multer = require('multer');

const cloudinary = require('cloudinary').v2;
const pLimit = require('p-limit');
const { SubCategory } = require('../models/subcategory');

const { Order } = require('../models/order');



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
router.post('/upload', upload.array("images"), async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
});




router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const search = req.query.search; // ✅ ADD THIS

    let filter = {};

    // ✅ CATEGORY FILTER
    if (category && category !== "") {
      filter.category = new mongoose.Types.ObjectId(category);
      console.log("SEARCH QUERY:", req.query.search);
    }

    // ✅ SEARCH FILTER
    if (search && search.trim() !== "") {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },        // search by name
        { description: { $regex: search, $options: "i" } }, // search by description
        { brand: { $regex: search, $options: "i" } }        // search by brand
      ];
    }

    console.log("FILTER:", filter);

    const totalProducts = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate("category")
      .populate("subCategory")
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      products,
      totalPages: Math.ceil(totalProducts / limit),
      page,
      totalProducts
    });

  } catch (error) {
    console.log("ERROR:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get("/best-sellers", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;

    let filter = {};

    // 🔹 Category filter (optional)
    if (category) {
      filter.category = new mongoose.Types.ObjectId(category);
    }

    // 🔹 Only show available products
    filter.countInStock = { $gt: 0 };

    const products = await Product.find(filter)
      .populate("category")
      .populate("subCategory")
      .sort({ totalSales: -1 }) // 🔥 best selling
      .limit(limit);

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      msg: error.message
    });
  }
});

router.get("/brands", async (req, res) => {
  try {
    const brands = await Product.distinct("brand");
    res.json({ brands });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// GET /api/products/new
router.get("/new", async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ dateCreated: -1 }) 
      .limit(12);

    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================= RELATED PRODUCTS =================
router.get('/related/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // 1️⃣ First: same category + subCategory
    let relatedProducts = await Product.find({
      category: product.category,
      subCategory: product.subCategory,
      _id: { $ne: productId }
    })
      .populate("category")
      .populate("subCategory")
      .limit(8);

    // 2️⃣ If less products → fetch from same category only
    if (relatedProducts.length < 8) {
      const moreProducts = await Product.find({
        category: product.category,
        _id: { $ne: productId }
      })
        .populate("category")
        .populate("subCategory")
        .limit(8 - relatedProducts.length);

      // merge & remove duplicates
      const allProducts = [...relatedProducts, ...moreProducts];

      const uniqueProducts = Array.from(
        new Map(allProducts.map(item => [item._id.toString(), item])).values()
      );

      relatedProducts = uniqueProducts;
    }

    return res.status(200).json({
      success: true,
      products: relatedProducts
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/by-ids', async (req, res) => {
  try {
    const ids = req.body.ids;

    const products = await Product.find({
      _id: { $in: ids }
    })
      .populate("category")
      .populate("subCategory");

    res.status(200).json({
      success: true,
      products
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get("/trending-by-country", async (req, res) => {
  try {
    const { country, limit = 10 } = req.query;

    if (!country) {
      return res.status(400).json({
        success: false,
        message: "Country is required"
      });
    }

    const result = await Order.aggregate([
      {
        $match: {
          "shippingAddress.country": country,
          status: { $ne: "Cancelled" }
        }
      },

      { $unwind: "$orderItems" },

      {
        $group: {
          _id: "$orderItems.productId",
          totalSold: { $sum: "$orderItems.quantity" }
        }
      },

      {
        $sort: { totalSold: -1 }
      },

      {
        $limit: parseInt(limit)
      },

      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },

      { $unwind: "$product" },

      {
        $project: {
          _id: 0,
          totalSold: 1,
          product: 1
        }
      }
    ]);

    res.json({
      success: true,
      products: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
router.get('/:id', async (req, res) => {
  try {
    
   const product = await Product.findById(req.params.id)
  .populate("category")
  .populate("subCategory");

    if (!product) {
      res.status(500).json({ message : 'The product with the given ID was not found.'});
    }

   return res.status(200).send(product);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {

      const deletedProduct = await Product.findByIdAndDelete(req.params.id);

  if (!deletedProduct) {
    return res.status(400).json({ message : 'product not find!',status:false });

  }
       res.status(200).send({ status:true , message : 'product Deleted!' });


  
});

router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        description: req.body.description,
        images: req.body.images,
        brand: req.body.brand,
        color: req.body.color,
        price: Number(req.body.price),
        oldPrice: Number(req.body.oldPrice),
        category: req.body.category,
        subCategory: req.body.subCategory,
        countInStock: Number(req.body.countInStock),
        isFeatured: req.body.isFeatured,
        discount: req.body.discount,

        productRAMS: req.body.productRAMS,
        productWEIGHT: req.body.productWEIGHT,
        productSIZE: req.body.productSIZE,

        // ✅ ADD THIS
        specifications: req.body.specifications
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



router.post('/create', async (req, res) => {
  try {

    const category = await Category.findById(req.body.category);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Invalid Category"
      });
    }

    if (!req.body.images || req.body.images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images provided"
      });
    }
const subCategory = await SubCategory.findById(req.body.subCategory);
if (!subCategory) {
  return res.status(400).json({
    success: false,
    message: "Invalid SubCategory"
  });
}
  let product = new Product({
  name: req.body.name,
  description: req.body.description,
  images: req.body.images,
  color: req.body.color,
  brand: req.body.brand,
  price: Number(req.body.price),
  oldPrice: Number(req.body.oldPrice),
  category: req.body.category,
  subCategory: req.body.subCategory,
  countInStock: Number(req.body.countInStock),
  isFeatured: req.body.isFeatured === true || req.body.isFeatured === "true",
  discount: req.body.discount,

  productRAMS: req.body.productRAMS,
  productWEIGHT: req.body.productWEIGHT,
  productSIZE: req.body.productSIZE,


  // ✅ ADD THIS
  specifications: req.body.specifications
});

    product = await product.save();

    res.status(201).json({
      success: true,
      product: product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



module.exports = router;