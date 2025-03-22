import mongoose from "mongoose";

const serviceProviderSchema = new mongoose.Schema(
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
        },
        mpin : {
            type : String,
        },
        phoneNo : {
            type : mongoose.Types.ObjectId,
            ref : 'phoneNumber',
            required : true
        }
    }
)

export default mongoose.model("ServiceProvider", serviceProviderSchema)