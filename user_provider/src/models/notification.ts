import mongoose from "mongoose";

const notifySchema = new mongoose.Schema({
    tittle : {
        type : String,
        required : true
    },
    message : {
        type : String,
        required : true
    },
    datetime : {
        type : Date,
        default : Date.now
    }
});
export const Notify = mongoose.model("Notify", notifySchema);
