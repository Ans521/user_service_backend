import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    serviceProviderId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "ServiceProvider",
    },
    // userId : {
    //     type : mongoose.Schema.Types.ObjectId,
    //     ref : "User",
    // },
    // offerid : {
    //     type : mongoose.Schema.Types.ObjectId,
    //     ref : "Service",
    //     required : true
    // }, 
    price : {
        type : Number,
        required : true
    },
    status : {
        type : String,
        enum : ["created", "accepted", "rejected", "completed"],
        default : "created"
    },
    createdAt : {
        type : Date,
        default : Date.now
    }
})


export const Order = mongoose.model('Order', orderSchema);