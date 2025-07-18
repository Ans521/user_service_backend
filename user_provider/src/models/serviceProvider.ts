import { Base } from "./baseSchema";
import mongoose from "mongoose";
import { imagesKey } from "../shortObj"
import { timeStamp } from "console";
import { send } from "process";
const serviceProviderSchema = new mongoose.Schema({
  isUserVerifed: {
    type: Boolean,
    default: false
  },
  isProfileCompleted: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: {
      [imagesKey.aadharCard]: String,
      [imagesKey.aadharCardBack]: String,
      [imagesKey.photo]: String,
      [imagesKey.panCard]: String
    },
    _id: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: "pending"
  },
  category: {
    type: mongoose.Types.ObjectId,
    ref: "Category"
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory"
  },
  aadharAddress: {
    type: String
  },
  avgRating: {
    type: Number,
    default: 0
  },
  reviewComments: {
    type: [{
      sendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: Number,
      comment: String,
      message: String
    }],
    default: [],
    _id: false
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
      start: String,
      end: String
    },
    default: {
      start: "",
      end: ""
    },
    _id: false
  },
  workingDays: {
    type: [String],
    enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    default: ["Mon", "Fri"]
  },
  dailyHoursAvailable: {
    type: String
  },
  completedTasks: {
    type: Number,
    default: 0
  },
  visitingTime: {
    type: String
  },
  services: {
    type: [{
      service: String,
      serviceList: String
    }],
  },
  servicePrice: {
    type: Number,
    default: 0
  },
  scanQrUrl: {
    type: String
  },

});

export const ServiceProvider = Base.discriminator("ServiceProvider", serviceProviderSchema);
