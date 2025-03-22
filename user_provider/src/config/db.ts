import dotenv from 'dotenv';
import mongose from 'mongoose';
dotenv.config();

export const connectDb = async () =>{
    try{
        await mongose.connect(process.env.MONGO_URL as string);
        console.log("Database connected...");
    }catch(error){
        console.log(error);
        process.exit(1);
    }
}