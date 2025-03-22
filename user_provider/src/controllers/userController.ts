import { Request, Response } from "express";
import { connectDb } from "../config/db";
import PhoneNumber from "../models/phone";
import { User } from "../models/user";
import { ServiceProvider } from "../models/serviceProvider";
import { Base } from "../models/baseSchema";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import mutler from 'multer';
import path from 'path';
import multer from "multer";
import fs from 'fs';
import phone from "../models/phone";
import { log } from "console";

dotenv.config()
connectDb()
const secretKey = process.env.SECRET_KEY || '1n1b484n39886ni124114inai';

const client = new Redis({
    host : '192.168.7.12',
    port : 6379
});

const redisOperation = async(phone : string, otp : number, toStore : boolean = true)=>{
    if(toStore){
        await client.set(`otp:${phone}`, otp.toString(), "EX", 600)
        await client.set(`phone:${otp}`, phone.toString(), "EX", 600)
    }else{
        await client.del(`phone:${otp}`)
        await client.del(`otp:${phone}`)
    }
}

export const getOtp = async (req : any, res : any) => {
    try {
        const {phone} = req.body;
        const otp = Math.floor(1000 + Math.random() * 9999);

        const response = await PhoneNumber.findOne({phoneNumber : phone})
        
        //user enter the phone number checking that is in the mongodb or not
        if(!response){
            await new PhoneNumber({phoneNumber : phone}).save()
            await redisOperation(phone, otp)
            return res.status(200).json({ message: "otp generated", otp });
        }else{
            // if phone number is found in mongodb
            const otpRedis = await client.get(`otp:${phone}`)
            const phoneNo = response.phoneNumber;
            if(!otpRedis){
                await redisOperation(phoneNo, otp)
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
        const {userOtp, role} = req.body;
        if(!userOtp || !role){
            return res.status(200).json("Enter OTP || Provide user role")
        }
        const phoneNo1 = await client.get(`phone:${userOtp}`)
        
        if(!phoneNo1){
            return res.status(404).json("Invalid OTP or OTP Expired")
        }

        const storedOtp = await client.get(`otp:${phoneNo1}`);

        if(storedOtp != userOtp){
            return res.status(200).json({message : "Enter valid otp", userOtp})
        }
        const phoneRef = await PhoneNumber.findOne({phoneNumber : String(phoneNo1)})

        if(!phoneRef){
            return res.json("phoneref is not there ")
        }
        if(role && typeof role === "string"){
            if(role === "user"){
               // find the user with the phone number, update the isUserLo
               const userData = await User.findOne({phoneNo : phoneRef?._id}) as typeof User & {loggedInBefore?: boolean};

               if(userData?.loggedInBefore){
                    redisOperation(phoneNo1, userOtp, false)
                    return res.status(200).json({message : "user is loggedin before, you can redirect it", userData})
                }else{
                    try{
                        const notLoggedUserData = await new User({phoneNo : phoneRef?._id}).save()
                        console.log("User is logging in for the first time.");
                        redisOperation(phoneNo1, userOtp, false)
                        return res.status(200).json({message : "User is logging in for the first time", "notLoggedUserData" : notLoggedUserData})
                    }catch(error){
                        console.log(error)
                        return res.status(500).json({message : "Error Occured"});
                    }
                } 
            }else if(role === "serviceprovider"){

                const providerData = await ServiceProvider.findOne({phoneNo : phoneRef}) as typeof ServiceProvider & {loggedInBefore?: boolean, isUserVerifed? : boolean}

               if(providerData?.loggedInBefore){
                    const isUserLoggedInBefore = providerData?.loggedInBefore;
                   const isUserVerifed = providerData?.isUserVerifed;
                   if(providerData?.isUserVerifed){
                        redisOperation(phoneNo1, userOtp, false)
                        return res.status(200).json({message : "Service provider verified"}, providerData)
                   }else{
                        redisOperation(phoneNo1, userOtp, false)
                        return res.status(200).json({
                            message: "Service provider is loggedInBefore but not verified yet by admin",
                            isUserLoggedInBefore: isUserLoggedInBefore,
                            isUserVerifed: isUserVerifed,
                          });                          
                   }
                }else{
                    try {
                        const newProvider = await new ServiceProvider({phoneNo : phoneRef?._id}).save();
                        console.log("provider logging in for the first time")
                        redisOperation(phoneNo1, userOtp, false)
                        return res.status(200).json({message : "new user loggedIn", newProvider})
                    } catch (error) {
                        console.log(error);
                        return res.status(500).json({message : "Error Occured"});
                    }
                }
            }
        }
        return res.status(200).json("user loggedIn");
    }catch(err){
        console.log(err)
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
        console.log(userData)
        if(!userData){
            return res.status(404).json({message : "Phone Number has not been stored"})
        }

        const existingUser: any = await User.findOne({ email })
        console.log(existingUser)
        if (existingUser) {
            return res.status(400).json({ message: "Email is already registered." });
        }

        // need to check this --> 
        const phoneNoId = userData?._id;
        
        const loggedInBefore = true;
        const registerData : any = { name, email, address, category, subcategory, loggedInBefore}
        const newUser = await User.findOneAndUpdate(
            {phoneNo : phoneNoId},
            {$set : registerData},
            {new : true}
        )
        const token = jwt.sign({id : phoneNoId.toString()}, secretKey)
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

    try {
        const serviceProviderData: any = { name, email, address, phoneNo: phoneNoId };

        if (mpin && typeof mpin === "string") {
            const hashedMpin = await bcrypt.hash(mpin, 10);
            console.log("hashedMpin", hashedMpin);
            serviceProviderData.mpin = hashedMpin;
        }

        const newServiceProvider = new ServiceProvider(serviceProviderData);

        await newServiceProvider.save();

        res.status(200).json({
            message: "User registered successfully",
            user: newServiceProvider,
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "An error occurred, please try again later" });
    }
};

const directoryPath = path.join(__dirname, '../../uploads');

if(!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath);
}

const uploadImage  = mutler.diskStorage({
    destination : function(req : any, file, cb){
        cb(null, directoryPath)
    },

    filename : function(req : any, file, cb){
        const fileName = Date.now() + path.extname(file.originalname)
        cb(null, fileName)
        console.log(file.originalname)
        req.fileUrl  = `http://localhost:3000/uploads/${fileName}`
    }
})

export const upload = multer({storage : uploadImage})

export const handleImage = (req : any, res : any) => {
    if(!req.file || !req.fileUrl){
        return res.status(400).send("No file uploaded.");
    }
    return res.status(200).json({message: "File uploaded successfully", file: req.fileUrl})
}

export const handleImageUrl = async (req: any, res: any) => {
    try {
      const { imageUrl, phone } = req.body;
        if(!imageUrl || !phone){
            return res.status(406).json({ message: "Please provide required field" });
        }
      if (!Array.isArray(imageUrl) || imageUrl.length === 0) {
        return res.status(400).json({ message: "Invalid or empty URL array." });
      }
  
      const phoneData = await PhoneNumber.findOne({ phoneNumber: phone });
      if (!phoneData) {
        return res.status(404).json({ message: "Phone number not found." });
      }
  
     const isUserVerifed = false;
     const isloggedInBefore = true
     const token: string = jwt.sign({id : phoneData?._id.toString()}, secretKey);
      const providerData = await ServiceProvider.findOneAndUpdate(
        {phoneNo: phoneData?._id},
        {$set : {
            imageUrl: imageUrl,
            isUserVerifed,
            loggedInBefore : isloggedInBefore
        }}, {new : true}
      );
      
      res.cookie("token", token).status(200).json({ message: "URLs updated successfully.", providerData });
    } catch (err) {
      res.status(500).json({ message: "Internal server error.", error: err });
    }
  };
  