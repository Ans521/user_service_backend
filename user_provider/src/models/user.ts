import { Base } from "./baseSchema";

import mongoose, { Schema } from "mongoose";
const userSchema = new mongoose.Schema({

   mpin: {
      type: String
   },
   profilePic: {
      type: String,
      default: "not provided"
   },
 
});

export const User = Base.discriminator("User", userSchema);