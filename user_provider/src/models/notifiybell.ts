import mongoose from "mongoose";

const notifyBellSchema = new mongoose.Schema({
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceProvider',
        required: true
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
        required : true
    },
    isRead : {
        type : Boolean,
        default : false
    },
    datetime : {
        type : Date,
        default : Date.now
    }
    
});

export const NotifyBell = mongoose.model("NotifyBell", notifyBellSchema);
