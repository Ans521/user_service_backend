import mongoose from "mongoose";

const phoneSchema = new mongoose.Schema(
    {
        phoneNumber : {
            type : Number,
            required : true,
            unique : true
        },
        email:{
            type : String,
            required : true,
            unique : true
        }
    }
)

export default mongoose.model("PhoneNumber", phoneSchema);