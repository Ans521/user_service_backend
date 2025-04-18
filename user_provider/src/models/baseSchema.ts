  import mongoose from "mongoose";

  const baseSchema = new mongoose.Schema(
    {
      name: {
        type: String,
      },
      email: {
        type: String,
        sparse: true,
      },
      address: {
        type: String,
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
    },
    { discriminatorKey: "role"}
  );

  export const Base = mongoose.model("Base", baseSchema);
