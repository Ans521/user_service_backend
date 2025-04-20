import { Base } from "./baseSchema";
import mongoose from "mongoose";
const serviceProviderSchema = new mongoose.Schema({
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
  },
    category : {
      type : String,
  },
    subcategory : {
      type : String,
  },
  aadharAddress : {
    type : String 
  }
});

export const ServiceProvider = Base.discriminator("ServiceProvider", serviceProviderSchema);
