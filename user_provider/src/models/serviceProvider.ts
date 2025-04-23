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
    type:String,
  },
  subcategory : {
    type : String
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
    type: String
  },
  galleryImages: {
    type: [String],
    default: []
  },
  weekDaysAvailable: {
    type: [String], 
    default: []
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
 }
});

export const ServiceProvider = Base.discriminator("ServiceProvider", serviceProviderSchema);
