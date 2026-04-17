const mongoose = require('mongoose');

const subCategorySchema = mongoose.Schema({
    
    name: {
        type: String,
        required: true,
    },
    
  images: {
  type: [String],
  required: true
},
  
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Category',
        required: true,
    },
       
})


exports.SubCategory = mongoose.model('SubCategory',subCategorySchema )