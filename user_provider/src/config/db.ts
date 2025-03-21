import e from "express";

const mongose = require("mongoose");

export const connectDb = async () =>{
    try{
        await mongose.connect('mongodb+srv://anshsharma:mukeshsh@cluster0.lg1bd.mongodb.net/');
        console.log("Database connected...");
    }catch(error){
        console.log(error);
        process.exit(1);
    }
}