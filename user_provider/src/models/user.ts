import { Base } from "./baseSchema";

import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  category: {
    type: String,
  },
  subcategory: {
    type: String,
  },
});

export const User = Base.discriminator("User", userSchema);
