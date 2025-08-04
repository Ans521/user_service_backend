import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    razorpay_order_id : {
        type :  String,
        required : true
    },
    providerId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "ServiceProvider",
    },
    offerid : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Offer",
        required : true
    },
    status : {
        type : String,
        enum : ["pending", "paid", "failed"],
        default : "pending"
    },
    startDate : {
        type : Date,
        default : Date.now
    },
    endDate : {
        type : Date,
    },
    isActive : {
        type : Boolean,
        default : true
    }
})


export const Order = mongoose.model('Order', orderSchema);