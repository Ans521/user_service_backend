import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  category: { type: String},
  subcategories: [{ type: String }],
});

export const Category = mongoose.model("Category", categorySchema);
