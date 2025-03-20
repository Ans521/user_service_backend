import mongoose from "mongoose";
import phoneNumber from "./phone"

const userSchema = new mongoose.Schema(
    {
        name : {
            type : String,
            required : true
        },
        email : {
            type : String,
            required : true,
            unique : true
        },
        address : {
            type : String,
            required : true,
            unique : true
        },
        category : {
            type : String,
            required : true,
        },
        subcategory : {
            type : String,
            unique : true
        },
        phoneNo : {
            type : mongoose.Types.ObjectId,
            ref : 'phoneNumber'
        }
    }
)

export default mongoose.model("User", userSchema) 