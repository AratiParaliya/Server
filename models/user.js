const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  phone: Number,

  password: {
    type: String,
    required: function () {
      return !this.googleId;
    }
  },

  googleId: {
    type: String,
    default: null
  },

  loginType: {
    type: String,
    enum: ["manual", "google"],
    default: "manual"
  },

status: {
  type: String,
  enum: ["active", "inactive", "blocked"],
  default: "inactive"
},

  isVerified: {
    type: Boolean,
    default: false
  },
verificationToken: String,
  image: {
    type: String,
    default: ""
  },

  otp: Number,
  otpExpire: Date,

  firstName: String,
  lastName: String,
  companyName: String,
  country: String,
  address1: String,
  address2: String,
  city: String,
  state: String,
  zipCode: String,

  dateCreated: {
    type: Date,
    default: Date.now,
  }
});
exports.User = mongoose.model('User', userSchema);