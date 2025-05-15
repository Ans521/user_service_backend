import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
    imageUrl : {
        type : [String]
    }

});
export const Banner = mongoose.model("Banner", bannerSchema);
