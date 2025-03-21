import { Request, Response } from "express";
import { connectDb } from "../config/db";
import User from "../models/user";
import PhoneNumber from "../models/phone";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import phone from "../models/phone";

connectDb()
const secretKey = 'bdaic193cakjnc';

const client = new Redis({
    host : '192.168.29.103',
    port : 6379
});

export const getOtp = async (req : any, res : any) => {
    try {
        const {phone} = req.body;
        const otp = Math.floor(1000 + Math.random() * 9999);

        const response = await PhoneNumber.findOne({phoneNumber : phone})
        const phoneNo = response?.phoneNumber;
        //user enter the phone number checking that is in the mongodb or not
        if(!phoneNo){
            // if the phone number is not found in the mongodb
            const newPhoneNumber = new PhoneNumber({phoneNumber : phone})
            await newPhoneNumber.save();

            await client.set(`otp:${phone}`, otp.toString(), "EX", 600);
            await client.set(`phone:${otp}`, phone.toString(), "EX", 600);
        }else{
            // if phone number is found in mongodb
            const otpRedis = await client.get(`otp:${phoneNo}`)
            if(!otpRedis){
                await client.set(`otp:${phoneNo}`, otp.toString(), "EX", 600,)
                await client.set(`phone:${otp}`, phoneNo.toString(), "EX", 600,)
                const newOtp = await client.get(`otp:${phoneNo}`)
                return res.status(200).json({message : "otp generated", newOtp})
            }
            return res.status(200).json({message : "fetched otp", otpRedis})
        }
        return res.status(200).json({ message: "Done", otp });
    } catch (error) {
        return res.status(500).send(error);
    }
};

export const verifyOtp = async (req: any, res : any) => {
    try{
        const {userOtp} = req.body;
        if(!userOtp){
            return res.status(200).json("Enter OTP ")
        }
        const phoneNo = await client.get(`phone:${userOtp}`)
        // const response = await PhoneNumber.findOne({phoneNumber : phoneNo})
        // const id = response?._id

        if(!phoneNo){
            return res.status(404).json("Invalid Otp")
        }
        const storedOtp = await client.get(`otp:${phoneNo}`);
        
        if(storedOtp != userOtp){
            return res.status(200).json({message : "Enter valid otp", userOtp})
        }

        const token = jwt.sign({
            // id,
            phoneNo
        }, secretKey, {expiresIn : '1h'})

        await client.del(`phone:${userOtp}`)
        await client.del(`otp:${phoneNo}`)
        res.cookie("token", token).status(200).json("user loggedIn");
    }catch(err){
        res.status(500).json({message : "not verified"});
    }
}

export const registerUser = async (req : any, res : any) =>{
    const { phoneNumber} = req.cookies;

    if(!phoneNumber){
        return res.status(400).json({ message: "Not Authenticated" });
    }

    const {name, email, address, category, subcategory} = req.body;

    if (!name || !email || !address || !category || !subcategory) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try{

    const existingEmail : any = await User.findOne({email});

    if(existingEmail){
        return res.json(400).json("email is already registered")
    }

    const existingPhone : any = await User.findOne({phoneNumber});

    if(!existingPhone){
        return res.status(400).json({ message: "Not Authenticated" });
    }

    const existingUser : any = await User.findOne({email})

    if(existingUser){
        return res.status(400).json({ message: "Email is already registered." });
    }

    const userData : any = {name, email, address, category, subcategory, phoneNo : existingUser?._id}
    const newUser = new User(userData)
    await newUser.save()
    res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (err) {
        res.status(500).json({message : err});
    }
}

export const registerProvider = async (req : any, res : any) => {
    const {name, email, address, mpin} = req.body;
    // 406 ==> is for the not accceptable
    if(!name || !email || !address || !mpin){
        return res.status(400).json({message : "provide all the field"})
    }
    const existingEmail = await User.findOne({email});
    
    if(existingEmail){
        return res.json(400).json("email is already registered")
    }
    
    const {token} = req.cookies
    const userData = {name, email, address};
    
    try {
        const hashedMpin = await bcrypt.hash(mpin, 10);
// suppose i have two input field password and confirm password we have to validate this password in the frontend then store it in the backend  
    } catch (error) {
        
    }
}