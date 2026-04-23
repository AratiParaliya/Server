const express = require('express');
const router = express.Router();
const { User } = require('../models/user');
const bcrypt = require('bcryptjs');
const { Order } = require("../models/order");
const { Wishlist } = require("../models/wishlist");
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client("162232767679-r2gieupemo5vstpksupm3dgf48tn0grj.apps.googleusercontent.com");


const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });


const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "multimartwebapp@gmail.com",
    pass: process.env.App_Pass
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log("EMAIL ERROR:", error);
  } else {
    console.log("Email server is ready");
  }
});
// ✅ SIGNUP
const crypto = require("crypto");

router.post('/signup', async (req, res) => {
  try {

    const existingUser = await User.findOne({ email: req.body.email });

    if (existingUser) {
      return res.status(400).json({
        error: true,
        msg: "User already exists"
      });
    }

    const hashPassword = bcrypt.hashSync(req.body.password, 10);

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: hashPassword,
      role: req.body.role || "user",
      status: "active",
      isVerified: false, // ❗ important
      loginType: "manual",
      verificationToken
    });

    const savedUser = await user.save();

    // ✅ EMAIL LINK
   const verifyLink = `https://shopkartify.netlify.app/api/user/verify-email/${verificationToken}`;
   await transporter.sendMail({
  from: '"MyStore" <multimartwebapp@gmail.com>',
  to: savedUser.email,
  subject: "Confirm your email",
  html: `
  <div style="margin:0; padding:0; background:#f5f5f5; font-family: Arial, sans-serif;">
    
    <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:10px; text-align:center; padding:40px;">
      
      <!-- Logo -->
     <div style="margin-bottom:20px; display:flex; align-items:center; gap:10px; justify-content:center;">
  
  <!-- Logo Box -->
  <div style="
    width:40px;
    height:40px;
    border-radius:12px;
    background: linear-gradient(135deg,#1a6fc4 0%,#0f4c81 100%);
    display:flex;
    align-items:center;
    justify-content:center;
    color:#fff;
    font-weight:800;
    font-size:18px;
    font-family: 'Sora', sans-serif;
    box-shadow:0 4px 14px rgba(26,111,196,.35);
  ">
    S
  </div>

  <!-- Brand Name -->
  <span style="
    font-family:'Sora', sans-serif;
    font-size:20px;
    font-weight:700;
    color:#0f1b2d;
    line-height:1;
  ">
    Shop<span style="color:#1a6fc4;">Kart</span>
  </span>

</div>

      <!-- Title -->
      <h2 style="margin:10px 0; color:#111;">Welcome to MyStore</h2>

      <!-- Text -->
      <p style="color:#555; font-size:15px; line-height:1.6;">
        Please take a second to make sure we've got your email right.
        Didn’t sign up? <span style="color:#000; font-weight:bold;">Let us know.</span>
      </p>

      <!-- Button -->
      <a href="${verifyLink}" target="_blank"
        style="
          display:inline-block;
          margin-top:25px;
          background:#e60023;
          color:#fff;
          padding:14px 30px;
          border-radius:30px;
          text-decoration:none;
          font-size:16px;
          font-weight:bold;
        ">
        Confirm your email
      </a>

      <!-- App Section -->
      <p style="margin-top:40px; color:#666;">Download our app</p>

      <div style="margin-top:10px;">
        <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" width="120" style="margin-right:10px;" />
        <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" width="135" />
      </div>

      <!-- Footer -->
      <p style="margin-top:40px; font-size:13px; color:#999;">
        This email was sent to ${savedUser.email}
      </p>

      <p style="font-size:13px; color:#000; font-weight:bold; cursor:pointer;">
        Not my account
      </p>

    </div>
  </div>
  `
});

    res.status(201).json({
      success: true,
      msg: "Account created! Please check your email to verify."
    });

  } catch (error) {
    res.status(500).json({
      error: true,
      msg: error.message
    });
  }
});

// ✅ UPDATE VERIFY STATUS
router.put("/verify/:id", async (req, res) => {
  try {
    const { status } = req.query;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: status === "true" },
      { new: true }
    );

    res.json({
      success: true,
      user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      msg: error.message
    });
  }
});

const jwt = require('jsonwebtoken');


// ✅ LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: true, msg: "User not found" });
    }

    // ❌ If no password → must use Google
    if (!user.password) {
      return res.status(400).json({
        error: true,
        msg: "Login with Google or set password"
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: true, msg: "Invalid credentials" });
    }

    if (user.status === "blocked") {
      return res.status(400).json({ error: true, msg: "Your account is blocked" });
    }

    if (!user.isVerified) {
      return res.status(400).json({ error: true, msg: "Email not verified" });
    }

    await User.findByIdAndUpdate(user._id, {
      status: "active",
      lastLogin: new Date()
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      "SECRET_KEY",
      { expiresIn: '1d' }
    );

    res.json({ success: true, token, user });

  } catch (error) {
    res.status(500).json({ error: true, msg: error.message });
  }
});



router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, msg: "User not found" });
    }

    if (user.isVerified) {
      return res.json({ success: false, msg: "Email already verified" });
    }

    // Generate fresh token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    await User.findByIdAndUpdate(user._id, { verificationToken });

   const verifyLink = `https://shopkartify.netlify.app/api/user/verify-email/${verificationToken}`;

    await transporter.sendMail({
      from: "multimartwebapp@gmail.com",
      to: email,
      subject: "Verify Your Email — MyStore",
      html: `
        <h2>Email Verification</h2>
        <p>Click the link below to verify your account:</p>
        <a href="${verifyLink}" style="
          display:inline-block;padding:10px 20px;
          background:#0f1117;color:#fff;
          border-radius:8px;text-decoration:none;font-weight:600;
        ">Verify Email</a>
        <p style="color:#94a3b8;font-size:12px;margin-top:20px;">
          This link expires in 24 hours.
        </p>
      `
    });

    res.json({ success: true, msg: "Verification email sent!" });

  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
});
router.get('/verify-email/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token
    });

    if (!user) {
      return  res.redirect(`https://sh0pkart.netlify.app/verify-status?error=invalid`);
    }

    user.isVerified = true;
    user.verificationToken = undefined;

    await user.save();

    // ✅ GENERATE TOKEN
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      "SECRET_KEY",
      { expiresIn: "1d" }
    );

    // ✅ REDIRECT TO FRONTEND WITH TOKEN
   return res.redirect(
  `https://shopkartify.netlify.app/verify-status?token=${token}&userId=${user._id}`
);

  } catch (error) {
    res.redirect(`https://shopkartify.netlify.app/verify-status?error=invalid`);
  }
});
router.get("/user-stats/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId);

    const totalOrders = await Order.countDocuments({ userId });

    const wishlist = await Wishlist.findOne({ user: userId });
    const totalWishlistItems = wishlist?.items?.length || 0;

    res.status(200).json({
      success: true,
      stats: {
        memberSince: user?.dateCreated,
        totalOrders,
        totalWishlistItems
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


 // your JWT middleware


router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    // ✅ total users count
    const totalUsers = await User.countDocuments();

    // ✅ paginated users
    const users = await User.find()
      .select('-password')
      .sort({ dateCreated: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      page
    });

  } catch (error) {
    res.status(500).json({
      error: true,
      msg: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    

    if (!user) {
      return res.status(404).json({
        error: true,
        msg: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    res.status(500).json({
      error: true,
      msg: error.message
    });
  }
});

// ✅ UPDATE USER
router.put('/:id', upload.single("image"), async (req, res) => {
  try {

    let updateData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      role: req.body.role,

      firstName: req.body.firstName,
      lastName: req.body.lastName,
      companyName: req.body.companyName,
      address1: req.body.address1,
      address2: req.body.address2,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode,
      country: req.body.country
    };

    // ✅ ADD THIS (IMPORTANT)
    if (req.file) {
  updateData.image = "https://shopkartify.netlify.app/uploads/" + req.file.filename;
}

    // ✅ password update
    if (req.body.password) {
      updateData.password = bcrypt.hashSync(req.body.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        error: true,
        msg: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      user: updatedUser,
      msg: "User updated successfully"
    });

  } catch (error) {
    res.status(500).json({
      error: true,
      msg: error.message
    });
  }
});

// ✅ DELETE USER
router.delete('/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({
        error: true,
        msg: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      msg: "User deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      error: true,
      msg: error.message
    });
  }
});


router.post('/google-signup', async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
  audience: "162232767679-r2gieupemo5vstpksupm3dgf48tn0grj.apps.googleusercontent.com"
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub } = payload;

    let user = await User.findOne({ email });

    // ❌ If already exists → block signup
    if (user) {
      return res.status(400).json({
        error: true,
        msg: "User already exists. Please sign in."
      });
    }

    // ✅ Create new user
    user = new User({
      name,
      email,
      phone: "",
      password: "",
      image: picture,
      role: "user",
      status: "active",
      isVerified: true,
      loginType: "google",
      googleId: sub
    });

    await user.save();

    res.status(200).json({
      success: true,
      msg: "Signup successful. Please sign in."
    });

  } catch (err) {
    res.status(500).json({ error: true, msg: err.message });
  }
});

router.post('/google-signin', async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
     audience: "162232767679-r2gieupemo5vstpksupm3dgf48tn0grj.apps.googleusercontent.com"
    });

    const payload = ticket.getPayload();
    const { email } = payload;

    let user = await User.findOne({ email });

    // ❌ If NOT exists → block login
    if (!user) {
      return res.status(400).json({
        error: true,
        msg: "User not found. Please sign up first."
      });
    }

    // ❌ If manual account
  if (user.loginType !== "google") {
  user.loginType = "google";
  await user.save();
}

    // ✅ LOGIN
    const tokenJWT = jwt.sign(
      { userId: user._id, role: user.role },
      "SECRET_KEY",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      token: tokenJWT,
      user
    });

  } catch (err) {
    res.status(500).json({ error: true, msg: err.message });
  }
});
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000);

    const user = await User.findOneAndUpdate(
      { email },
      { otp, otpExpire: Date.now() + 5 * 60 * 1000 },
      { new: true }
    );

    if (!user) {
      return res.json({ success: false, msg: "User not found" });
    }

    // ✅ SEND EMAIL
    await transporter.sendMail({
      from: "multimartwebapp@gmail.com",
      to: email,
      subject: "Your OTP Code",
      html: `<h3>Your OTP is: <b>${otp}</b></h3>`
    });

    res.json({ success: true, msg: "OTP sent successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      msg: "Error sending OTP"
    });
  }
});


router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    console.log("DB OTP:", user?.otp);
    console.log("Entered OTP:", otp);

    if (
      !user ||
      user.otp !== Number(otp) ||
      !user.otpExpire ||
      user.otpExpire < Date.now()
    ) {
      return res.json({
        success: false,
        msg: "Invalid or expired OTP"
      });
    }

    res.json({ success: true });

  } catch (error) {
    console.log("VERIFY OTP ERROR:", error);
    res.status(500).json({
      success: false,
      msg: "Server error"
    });
  }
});


router.post("/logout", async (req, res) => {
  try {
    const { userId } = req.body;

    await User.findByIdAndUpdate(userId, {
      status: "inactive"
    });

    res.json({
      success: true,
      msg: "Logged out successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      msg: error.message
    });
  }
});
router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email });

  if (!user || user.otp != otp) {
    return res.json({ success: false, msg: "Invalid OTP" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.otp = null;

  await user.save();

  res.json({ success: true });
});


module.exports = router;