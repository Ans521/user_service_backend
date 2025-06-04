import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
    imageUrl : {
        type : String
    },
    link : {
        type : String
    },
    position : {
        type : String,
        enum : ['top', 'bottom'],
        required : true
    }
});
export const Banner = mongoose.model("Banner", bannerSchema);
