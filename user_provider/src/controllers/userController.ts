import { Request, Response } from "express";
import { connectDb } from "../config/db";
import phoneNumber from "../models/phone";
import Redis from "ioredis";
import jwt from "jsonwebtoken";

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

        const response = await phoneNumber.findOne({phoneNumber : phone})
        const phoneNo = response?.phoneNumber;
        //user enter the phone number checking that is in the mongodb or not
        if(!phoneNo){
            // if the phone number is not found in the mongodb
            const newPhoneNumber = await phoneNumber.create({phoneNumber : phone})
            newPhoneNumber.save()
            await client.set(`otp:${phone}`, otp.toString(), "EX", 600)
            await client.set(`phone:${otp}`, phone.toString(), "EX", 600)
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

        if(!phoneNo){
            return res.status(404).json("Invalid Otp")
        }
        const storedOtp = await client.get(`otp:${phoneNo}`);
        
        if(storedOtp != userOtp){
            return res.status(200).json({message : "Enter valid otp", userOtp})
        }

        const token = jwt.sign({
            phoneNo
        }, secretKey, {expiresIn : '1h'})

        await client.del(`phone:${userOtp}`)
        await client.del(`otp:${phoneNo}`)
        console.log(token)
        res.cookie("token", token).status(200).json("user loggedIn");
    }catch(err){
        res.status(500).json({message : "not verified"});
    }
}

async function isUserAuthenticated(req : any, res : any, next : any){
    
       const token = req.cookies.token;
       if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
        }
        try{
            const decoded = jwt.verify(token, secretKey, async (err : any, userDoc : any) => {
            if(err){
                return res.status(403).json({ message: "Token is invalid or expired" });
            }
            const user = await phoneNumber.findOne({phoneNumber : userDoc.phoneNo})
            if(!user){
                return res.status(404).json({ message: "User not found" });
            }
            res.status(200).json({ message: "Data fetched", data: user });
        });

        next()
    } catch (err) {
        res.status(500).json({message : "not authenticated"});
    }
}

