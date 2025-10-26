import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  category: { type: String, required: true },
  isMain : { type: Boolean, default: false },
  idx : {type: Number}
});

export const Category = mongoose.model('Category', categorySchema);
