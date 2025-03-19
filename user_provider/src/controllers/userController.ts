import { Request, Response } from "express";
import { connectDb } from "../config/db";
import phoneNumber from "../models/phone";
import Redis from "ioredis";
import jwt from "jsonwebtoken";

connectDb()
const client = new Redis({
    host : '192.168.1.4',
    port : 6379
});

export const getOtp = async (req : any, res : any) => {
    try {
        const {phone} = req.body;
        const otp = Math.floor(1000 + Math.random() * 9999);

        if (!phone) {
            let phoneNo = await phoneNumber.findOne({phoneNumber : phone})
            if(!phoneNo){
                return res.status(404).json({message : "not found"})
            }
            const otpRedis = await client.get(`otp:${phone}`)
            console.log(otpRedis)
            if(!otpRedis){
                client.set(`otp:${phone}`,  otp.toString(), "EX", 600,)
                client.set(`phone:${otp}`, phoneNo.toString(), "EX", 600,)
                const newOtp = client.get(`otp:${phone}`)
                console.log(newOtp)
                return res.status(200).json({message : "otp generated", newOtp})
            }
            return res.status(200).json({message : "fetched otp", otpRedis})
        }
        const newPhoneNumber = await phoneNumber.create({phoneNumber : phone})
        client.set(`otp:${phone}`, otp.toString())
        client.set(`phone:${otp}`, phone.toString())
        newPhoneNumber.save()

        return res.status(200).json({ message: "Done", otp });
    } catch (error) {
        return res.status(500).send(error);
    }
};

export const verifyOtp = async(res : any, req : any) => {
    const userOtp = req.body;
    console.log(userOtp);
    if(!userOtp){
        return res.status(200).json("Enter OTP ")
    }
    const phoneNo = client.get(`phone:${userOtp}`)
    if(!phoneNo){
        return res.status(404).json("Invalid Otp")
    }
    const storedOtp = client.get(`otp:${phoneNo}`);
    if(storedOtp != userOtp){
        return res.status(200).json('Wrong OTP')
    }
    client.del(`otp:${userOtp}`)
    client.del(`otp:${phoneNo}`)

}