import mongoose from "mongoose";

const phoneSchema = new mongoose.Schema(
    {
        phoneNumber : {
            type : String,
            required : true,
            unique : true
        }
    }
)

export default mongoose.model("PhoneNumber", phoneSchema);