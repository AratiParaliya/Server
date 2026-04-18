
const cors = require('cors');
require('dotenv').config();

const express = require('express');

const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cloudinary = require("cloudinary").v2;

const app = express();


app.use(cookieParser());
app.use(cors());
app.use(bodyParser.json());


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Routes
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const subCategoryRoutes = require('./routes/subCategory')
const userRoutes = require('./routes/user')
const cartRoutes = require('./routes/cart')
const wishlistRoutes = require("./routes/wishlist");
const ordersRoutes = require("./routes/orders");
const paymentRoutes = require("./routes/payment");
const receiptRoutes = require("./routes/receipt");
const reviewsRoutes = require("./routes/Review");
const bannerRoutes = require("./routes/banner")
const uploadRoutes = require('./routes/upload');
const serviceRoutes = require("./routes/services");

app.use("/api/services", serviceRoutes);
app.use('/api/upload', uploadRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/reviews",reviewsRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/category', categoryRoutes);
app.use('/api/user', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/subCategory', subCategoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
// Database
mongoose.connect(process.env.CONNECTION_STRING)
.then(() => {
  console.log('Database Connection is ready...');
})
.catch((err) => {
  console.log(err);
});


// cloudinary.uploader.upload(
//   "https://res.cloudinary.com/demo/image/upload/sample.jpg"
// ).then(result => {
//   console.log("Upload success:", result.secure_url);
// }).catch(err => {
//   console.log(err);
// });

// Server
app.listen(process.env.PORT, () => {
  console.log(`server is running http://localhost:${process.env.PORT}`);

});