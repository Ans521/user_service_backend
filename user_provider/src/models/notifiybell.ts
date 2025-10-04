import mongoose from "mongoose";

const notifyBellSchema = new mongoose.Schema({
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceProvider',
    },
    tittle : {
        type : String
    },
    message : {
        type : String
    },
    senderId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Base",
    },
    isRead : {
        type : Boolean,
        default : false
    },
    type : {
        type : String,
    },
    datetime : {
        type : Date,
        default : Date.now
    }
    
});

export const NotifyBell = mongoose.model("NotifyBell", notifyBellSchema);
