import { Base } from "./baseSchema";

import mongoose from "mongoose";
const userSchema = new mongoose.Schema({

 mpin : {
    type : String
 },
 
 userMsg: {
   type: [{
      receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider' },
      messages : [{
         message : {type : String},
         timeStamp : {type : Date, default : Date.now}
      }]
   }]
 }
 
});

export const User = Base.discriminator("User", userSchema);