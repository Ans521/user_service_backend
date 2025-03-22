import { Request, Response } from "express";
import { connectDb } from "../config/db";
import User from "../models/user";
import PhoneNumber from "../models/phone";
import ServiceProvider from "../models/serviceProvider";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config()
connectDb()
const secretKey = process.env.SECRET_KEY || '1n1b484n39886ni124114inai';

const client = new Redis({
    host : '192.168.7.12',
    port : 6379
});

const storeInRedis = async(phone : string, otp : number)=>{
    await client.set(`otp:${phone}`, otp.toString(), "EX", 600)
    await client.set(`phone:${otp}`, phone.toString(), "EX", 600)
}

export const getOtp = async (req : any, res : any) => {
    try {
        const {phone} = req.body;
        const otp = Math.floor(1000 + Math.random() * 9999);

        const response = await PhoneNumber.findOne({phoneNumber : phone})
        
        //user enter the phone number checking that is in the mongodb or not
        if(!response){
            await new PhoneNumber({phoneNumber : phone}).save()
            await storeInRedis(phone, otp)
            return res.status(200).json({ message: "otp generated", otp });
        }else{
            // if phone number is found in mongodb
            const otpRedis = await client.get(`otp:${phone}`)
            const phoneNo = response.phoneNumber;
            if(!otpRedis){
                await storeInRedis(phoneNo, otp)
                return res.status(200).json({message : "otp generated", otp})
            }
            return res.status(200).json({message : "fetched otp", otpRedis})
        }
    } catch (error) {
        return res.status(500).send(error);
    }
};

export const verifyOtp = async (req: any, res : any) => {
    try{
        const {userOtp} = req.body;
        if(!userOtp){
            return res.status(200).json("Enter OTP")
        }
        const phoneNo = await client.get(`phone:${userOtp}`)
        
        if(!phoneNo){
            return res.status(404).json("Invalid OTP or OTP ")
        }

        const storedOtp = await client.get(`otp:${phoneNo}`);
        
        if(storedOtp != userOtp){
            return res.status(200).json({message : "Enter valid otp", userOtp})
        }

        await client.del(`phone:${userOtp}`)
        await client.del(`otp:${phoneNo}`)
        res.status(200).json("user loggedIn");
    }catch(err){
        res.status(500).json({message : "not verified"});
    }
}

export const registerUser = async (req : any, res : any) =>{
    const { name, email, address, category, subcategory, phone } = req.body;

    if (!name || !email || !address || !category || !subcategory || !phone) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try{
        const userData : any = await PhoneNumber.findOne({phoneNumber : phone});

        if(!userData){
            return res.status(404).json({message : "Phone Number has not been stored"})
        }

        const existingUser: any = await User.findOne({ email })

        if (existingUser) {
            return res.status(400).json({ message: "Email is already registered." });
        }

        // need to check this --> 
        const phoneNoId = userData?._id;
      
        const phoneNumber = await User.findOne({phoneNo : phoneNoId})

        if(phoneNumber){
            return res.status(406).json({message : "phoneNo stored already"})
        }
        const id = userData?._id;
        const registerData : any = { name, email, address, category, subcategory, phoneNo: userData?._id}
        const newUser = new User(registerData)
        await newUser.save()
        const token = jwt.sign({id : id.toString()}, secretKey)
        res.cookie("token", token).status(200).json({ message: "User registered successfully", user: newUser });

    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: "An error occurred, please try again later"});
    }
}


export const registerProvider = async (req: any, res: any) => {
    const { name, email, address, mpin, phone } : { name: string; email: string; address: string; mpin?: string; phone: string } = req.body;

    if (!name || !email || !address || !phone) {
        return res.status(400).json({ message: "Provide all the fields" });
    }

    const existingEmail = await ServiceProvider.findOne({ email });

    if (existingEmail) {
        return res.status(400).json({ message: "Email is already registered" });
    }

    const userData: any = await PhoneNumber.findOne({ phoneNumber: phone });
    
    if (!userData) {
        return res.status(404).json({ message: "Phone number not found" });
    }

    const phoneNoId = userData?._id;

    const alreadyUser = await ServiceProvider.findOne({ phoneNo: phoneNoId });
    
    if (alreadyUser) {
        return res.status(406).json({ message: "Phone number already stored" });
    }
    try {
        const serviceProviderData: any = { name, email, address, phoneNo: phoneNoId };

        if (mpin && typeof mpin === "string") {
            const hashedMpin = await bcrypt.hash(mpin, 10);
            console.log("hashedMpin", hashedMpin);
            serviceProviderData.mpin = hashedMpin;
        }

        const newServiceProvider = new ServiceProvider(serviceProviderData);

        await newServiceProvider.save();
        const token: string = jwt.sign({id : phoneNoId.toString()}, secretKey);

        res.cookie("token", token).status(200).json({
            message: "User registered successfully",
            user: newServiceProvider,
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "An error occurred, please try again later" });
    }
};
