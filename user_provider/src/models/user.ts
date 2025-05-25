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
   userMsg: {
      type: [{
         receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider' },
         messages: [new mongoose.Schema({
            message: { type: String },
            timeStamp: { type: Date, default: Date.now },
         }, { _id: false })]
      }],
   }
});

export const User = Base.discriminator("User", userSchema);