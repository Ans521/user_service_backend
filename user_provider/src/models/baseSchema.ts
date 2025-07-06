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
      }
    },
    { discriminatorKey: "role"}
  );

  export const Base = mongoose.model("Base", baseSchema);
