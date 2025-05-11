import mongoose from "mongoose";
 
const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Category'
  },
  image : {
    type : String,
  },
  iconImage : {
    type : String
  },
  specialCategory : {
    type : Boolean,
    default : false
  }
});
 
export const SubCategory = mongoose.model('SubCategory', subcategorySchema);
 
 