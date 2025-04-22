import { Base } from "./baseSchema";
import mongoose from "mongoose";

const serviceProviderSchema = new mongoose.Schema({
  isUserVerifed: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: [String]
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
  aadharAddress: {
    type: String
  },
  review: {
    type: Number, // changed from Float
    default: 0
  },
  reviewComments: {
    type: [String], // array of review strings
    default: []
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  experience: {
    type: Number, // in years
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
    type: [String], // like ["Monday", "Tuesday"]
    default: []
  },
  dailyHoursAvailable: {
    type: String // like "10:00 AM - 6:00 PM"
  },
  completedTasks: {
    type: Number,
    default: 0
  },
  visitingTime : {
    type : String
  },
  ChargePerTask: {
    type : Number
  }
});

export const ServiceProvider = Base.discriminator("ServiceProvider", serviceProviderSchema);
