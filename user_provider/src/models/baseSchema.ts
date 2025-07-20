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
        ref : "PhoneNumber",
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
      deviceToken : {
        type : String,
        default: null,
      },
      isFromBecomeProvider : {
        type : Boolean,
        default: false,
      },
      enquiry: {
          type: [{
            sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            isByMe: { type: Boolean, default: false },
            messages: [new mongoose.Schema({
              message: { type: String },
              timeStamp: { type: Date, default: Date.now }
            },
             { _id: false })],
          }],
        },
  recentConnectedUser: [{
      type: { type: String, required: true },
      userPhoneRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      isByMe : {
        type: Boolean,
        default: false
      },
      timeStamp: { type: Date, default: Date.now() },
      _id: false
    },
  ]  
    },
    { discriminatorKey: "role", strict: false}
  );

  export const Base = mongoose.model("Base", baseSchema);
