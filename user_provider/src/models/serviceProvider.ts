import { Base } from "./baseSchema";
import mongoose from "mongoose";

const serviceProviderSchema = new mongoose.Schema({
  isUserVerifed: {
    type: Boolean,
    default: false
  },
  // imageUrl: {
  //     "addharCard" : String,
  //     "addharCardBack" : String, 
  //     "panCard" : String, 
  //     "photo" :  String
  // },
  imageUrl:{
    type : [String]
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: "pending"
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref : "Category"
  },
  subcategory : {
    type : mongoose.Schema.Types.ObjectId,
    ref : "SubCategory"
  },
  aadharAddress: {
    type: String
  },
  avgRating: {
    type: Number,
    default: 0
  },
  reviewComments: {
    type : [{
      "totalStar" :  Number,
      "comment" : String
    }],
    default: [], 
    _id : false
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  experience: {
    type: Number,
    default: 0
  },
  totalDelivery: {
    type: Number,
    default: 0
  },
  aboutUs: {
    type: String, 
    default: ""
  },
  galleryImages: {
    type: [String],
    default: []
  },
  workingHours: {
    type: {
        start : String,
        end : String
    }, 
    default: {
        start : "",
        end : ""
    },
    _id : false
  },
  workingDays: {
    type: [String],
    default: ""
  },
  dailyHoursAvailable: {
    type: String
  },
  completedTasks: {
    type: Number,
    default: 0
  },
  visitingTime : {
    type : String
  },
  services : {
    type : [{
      "service" : String,
      "serviceList" : [String] 
    }]
 },
 servicePrice : {
  type : Number, 
  default: 0
 }
});

export const ServiceProvider = Base.discriminator("ServiceProvider", serviceProviderSchema);
