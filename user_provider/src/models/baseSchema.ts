import mongoose from "mongoose";

const baseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    address: {
      type: String,
    },
    email: {
      type: mongoose.Types.ObjectId,
      ref: "PhoneNumber",
    },
    pincode : {
      type : Number,
    },
    phoneNo: {
      type: mongoose.Types.ObjectId,
      ref: "PhoneNumber",
    },
    role: {
      type: String,
      enum: ["user", "serviceProvider"],
      required: true,
    },
    loggedInBefore: {
      type: Boolean,
      default: false,
    },
    deviceToken: {
      type: String,
      default: null,
    },
    isFromBecomeProvider: {
      type: Boolean,
      default: false,
    },
    enquiry: {
      type: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        isByMe: { type: Boolean },
        messages: [new mongoose.Schema({
          message: { type: String },
          timeStamp: { type: Date, default: Date.now }
        },
          { _id: false })],
      }],
    },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { 
        type: [Number],
        default: [0, 0],
        validate : {
        validator : function (val : number[]) {
          if(!val || val.length === 0) return true; 
           return (
            Array.isArray(val) &&
            val.length === 2 &&
            val.every((n) => Number.isFinite(n))
          );  

          // validator just return true or false on that basis mongoose will decide to save or not          
      },
      message: "Coordinates must be an array of [longitude, latitude]"
    }
      },
      
  },
    recentConnectedUser: [{
      type: { type: String, required: true },
      userPhoneRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      isByMe: {
        type: Boolean,
        default: false
      },
      timeStamp: { type: Date, default: Date.now() },
      _id: false
    }]
  },
  { discriminatorKey: "role", strict: false }
);

baseSchema.index({ location: "2dsphere" });

export const Base = mongoose.model("Base", baseSchema);
