const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    
    name: {
        type: String,
        required: true,
    },
     description: {
        type: String,
        required:true,
    },
    images: [
        {
        type:[String],
          required:true,
    }
    ],
    color: {
        type: String,
          default:''
    },
      brand: {
        type: String,
        default:''
    },
       price: {
        type: Number,
         default:0
    },
       oldPrice: {
        type: Number,
         default:0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Category',
        required: true,
    },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
        ref:'SubCategory',
        required: true,
  },
    countInStock: {
        type: Number,
        required:true,
    }, 
   rating : {
         type: Number ,
        default:0
    },
 
    discount: {
        type: Number,
        required:true,
    },
     specifications: [
        {
            key: { type: String },
            value: { type: String }
        }
    ],
    productRAMS: [{
        type:String
    }],
    productSIZE: [{
        type:String,
    }],
    productWEIGHT: [{
        type:String,
    }],
numReviews : {
         type: Number ,
        default:0
    },
     isFeatured : {
         type: Number ,
        default:0
    },
      dateCreated : {
         type: Number ,
        default:0
    },
         totalOrder: {
  type: Number,
  default: 0
},
      
      totalSales: {
  type: Number,
  default: 0
},
       
})


exports.Product = mongoose.model('Product',productSchema)