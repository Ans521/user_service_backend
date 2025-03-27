import { Base } from "./baseSchema";
import mongoose from "mongoose";
const serviceProviderSchema = new mongoose.Schema({
  mpin: {
    type: String,
  },
  isUserVerifed : {
    type : Boolean,
    default : false
 },
 imageUrl : {
  type : [String]
 },
 status : {
  type : String,
  enum : ['pending', 'approved', 'rejected'],
  default : "pending" 
 }
});

export const ServiceProvider = Base.discriminator("ServiceProvider", serviceProviderSchema);
