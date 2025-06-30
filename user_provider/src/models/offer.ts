import mongoose from "mongoose";

const offerSchema = new mongoose.Schema({
    imageUrl : {
        type : String,
        required : true
    },
    price : {
        type : Number,
        required : true
    },
    validity : {
        type : Number,
        required : true
    }
})

export const Offer = mongoose.model("Offer", offerSchema);