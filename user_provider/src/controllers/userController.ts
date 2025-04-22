import { Request, Response } from "express";
import { connectDb } from "../config/db";
import PhoneNumber from "../models/phone";
import { User } from "../models/user";
import { ServiceProvider } from "../models/serviceProvider";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import mutler from 'multer';
import path from 'path';
import multer from "multer";
import fs from 'fs';
import {createClient} from 'redis';
import verifyToken from "../middlewares/auth";
import { Category } from "../models/categorySchema";

dotenv.config()
connectDb()
const secretKey = '1n1b484n39886ni124114inai';

const client = createClient();

client.on('error', (err) => {
    console.error('Redis error:', err);
  });
  
  (async () => {
    try {
      await client.connect();
      console.log('Connected to Redis!');
    } catch (error) {
      console.error('Error connecting to Redis:', error);
    }
  })();

const redisOperation = async(phone : string, otp : number, toStore : boolean = true)=>{
    if(toStore){
        await client.setEx(`otp:${phone}`, 600, otp.toString());
        await client.setEx(`phone:${otp}`, 600, phone.toString());
    }else{
        await client.del(`phone:${otp}`)
        await client.del(`otp:${phone}`)
    }
}

export const getOtp = async (req : any, res : any) => {
    try {
        const {phone} = req.body;
        // const otp = Math.floor(1000 + Math.random() * 9999);
        const otp : number = 1111;
        const response = await PhoneNumber.findOne({phoneNumber : phone})
        
        //user enter the phone number checking that is in the mongodb or not
        if(!response){
            await new PhoneNumber({phoneNumber : phone}).save()
            await redisOperation(phone, otp)
            return res.status(200).json({data : { message: "otp generated", otp }});
        }else{
            // if phone number is found in mongodb
            const otpRedis = await client.get(`otp:${phone}`)
            const phoneNo = response.phoneNumber;
            if(!otpRedis){
                await redisOperation(phoneNo, otp)
                return res.status(200).json({data : {message : "otp generated", otp}})
            }
            return res.status(200).json({data : {message : "fetched otp", otpRedis}})
        }
    } catch (error) {
        return res.status(500).send(error);
    }
};

export const verifyOtp = async (req: any, res: any) => {
    try {
        const { userOtp, isEmployeeLogin } = req.body;
      
        if (!userOtp || typeof isEmployeeLogin === 'undefined') {
            return res.status(400).json({ message: "Invalid Otp or Type of isEmplyoeeLogin" });
        }

        const phoneNo1 = await client.get(`phone:${userOtp}`);
        if (!phoneNo1) {
            return res.status(404).json({ message: "Invalid OTP or OTP Expired" });
        }
        console.log(typeof userOtp)
        
        const storedOtp = await client.get(`otp:${phoneNo1}`);
        
        if (storedOtp !== userOtp) {
            return res.status(400).json({data : { message: "Enter valid OTP", userOtp }});
        }

        const phoneRef = await PhoneNumber.findOne({ phoneNumber: String(phoneNo1) });
        if (!phoneRef) {
            return res.status(404).json({ message: "No phone reference found" });
        }

        if (!isEmployeeLogin) {
            const userData = await User.findOne({ phoneNo: phoneRef?._id }) as typeof User & { loggedInBefore?: boolean };
            if (userData?.loggedInBefore) {
                redisOperation(phoneNo1, userOtp, false); 
                const token = jwt.sign({id : phoneRef?._id.toString()}, secretKey, { expiresIn: '12h' })
                return res.status(200).json({
                    message: "User logged in before",
                    userData: userData,
                    token: token
                  });
            } else {
                try {
                    const newUser = await new User({ phoneNo: phoneRef?._id }).save();
                    redisOperation(phoneNo1, userOtp, false);
                    return res.status(200).json({data : { message: "User logging in for the first time", newUser }});
                } catch (error) {
                    console.log(error);
                    return res.status(500).json({ message: "Error occurred while saving new user" });
                }
            }
        } else {
            const providerData = await ServiceProvider.findOne({ phoneNo: phoneRef }) as typeof ServiceProvider & { loggedInBefore?: boolean, isUserVerified?: boolean };
            if (providerData?.loggedInBefore) {
                if (providerData?.isUserVerified) {
                    redisOperation(phoneNo1, userOtp, false);
                    const token = jwt.sign({id : phoneRef?._id.toString()}, secretKey, { expiresIn: '12h' })
                    return res.status(200).json({
                        message: "Service provider verified",
                        providerData: providerData,
                        token: token
                      });
                } else {
                    redisOperation(phoneNo1, userOtp, false);
                    const token = jwt.sign({id : phoneRef?._id.toString()}, secretKey, { expiresIn: '12h' })
                    return res.status(200).json({
                        message: "Service provider logged in before but not verified yet by admin",
                        providerData: providerData,
                        token: token
                      });    
                }
            } else {
                try {
                    const newProvider = await new ServiceProvider({ phoneNo: phoneRef?._id }).save();
                    redisOperation(phoneNo1, userOtp, false);
                    return res.status(200).json({data : { message: "New service provider logged in", newProvider }});
                } catch (error) {
                    console.log(error);
                    return res.status(500).json({ message: "Error occurred while saving new provider" });
                }
            }
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Verification failed" });
    }
}

export const registerUser = async (req : any, res : any) =>{
    const { name, email, address, mpin, phone } = req.body;

    if (!name || !email || !address || !phone) {
        return res.status(400).json({ message: "All fields are required." });
    }
  
    try{
        const userData : any = await PhoneNumber.findOne({phoneNumber : phone});
        console.log(userData)

        if(!userData){
            return res.status(404).json({message : "Phone Number has not been stored"})
        }
        
        const existingUser : any = await User.findOne({ email })
        
        console.log(existingUser)
        
        if (existingUser) {
            return res.status(400).json({ message: "Email is already registered." });
        }
        
        // need to check this --> 
        const phoneNoId = userData?._id;
        
        const loggedInBefore = true;
        const registerData : any = { name, email, address, loggedInBefore}

        if (mpin && typeof mpin === "string") {
            const hashedMpin = await bcrypt.hash(mpin, 10);
            console.log("hashedMpin", hashedMpin);
            registerData.mpin = hashedMpin;
        }
    
        const newUser = await User.findOneAndUpdate(
            {phoneNo : phoneNoId},
            {$set : registerData},
            {new : true}
        )

        const token = jwt.sign({id : phoneNoId.toString()}, secretKey, { expiresIn: '12h' })
        return res.status(200).json({
            message: "User registered successfully",
            user: newUser,
            token: token
          });
          
    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: "An error occurred, please try again later"});
    }
}


export const registerProvider = async (req: any, res: any) => {
    const { name, email, address, address2, category, subcategory, phone } : { name: string; email: string; address: string; address2? : string, category? : string, subcategory? : string, phone: string } = req.body;

    if (!name || !email || !address || !phone || !category || !subcategory) {
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

    try {
        const serviceProviderData: any = { name, email, address, aadharAddress: address2, phoneNo: phoneNoId, category, subcategory };

        const newServiceProvider = new ServiceProvider(serviceProviderData);

        await newServiceProvider.save();

        return res.status(200).json({data : {
            message: "User registered successfully",
            user: newServiceProvider,
        }});
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "An error occurred, please try again later" });
    }
};

const directoryPath = path.join(__dirname, '../../uploads');

if(!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath);
}

const uploadImage = mutler.diskStorage({
    destination : function(req : any, file, cb){
        console.log("File being uploaded:", file);
        cb(null, directoryPath)
    },

    filename : function(req : any, file, cb){
        console.log("Original filename:", file.originalname);
        const fileName = Date.now() + path.extname(file.originalname)
        cb(null, fileName)

        if(req.file){
            req.fileUrl = `http://13.202.163.238:4000/uploads/${fileName}`;
        }else{
            if(!req.fileUrls){
                req.fileUrls = []
            }
            req.fileUrls.push(`http://13.202.163.238:4000/uploads/${fileName}`)
        }
    }
})

export const uploadMultiple = multer({ storage: uploadImage }).fields([
    { name: 'aadharCard', maxCount: 1 },
    {name : 'aadharCardBack', maxCount : 1},
    { name: 'photo', maxCount: 1 },
    { name: 'panCard', maxCount: 1 }
]);

export const upload = multer({storage : uploadImage})

export const handleImage = (req : any, res : any) => {
    if(!req.file || !req.fileUrl){
        return res.status(400).send("No file uploaded.");
    }
    return res.status(200).json({data : {message: "File uploaded successfully", file: req.fileUrl}})
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
     const isloggedInBefore = true;
     const providerData = await ServiceProvider.findOneAndUpdate(
         {phoneNo: phoneData?._id},
         {$set : {
             imageUrl: imageUrl,
             isUserVerifed,
             loggedInBefore : isloggedInBefore
            }}, {new : true}
        );

        const token: string = jwt.sign({id : phoneData?._id.toString()}, secretKey, { expiresIn: '12h' });
        return res.status(200).json({
            message: "URLs updated successfully.",
            providerData: providerData,
            token: token
          });
              } catch (err) {
      res.status(500).json({ message: "Internal server error.", error: err });
    }
  };

export const getProviderList = async (req : any, res : any) => {
    try {
        const providerData = await ServiceProvider.find({ role: 'ServiceProvider' }).populate('phoneNo');
        const providers = providerData.map((provider: any) => {
            return {
                _id: provider._id,
                name: provider.name,
                phoneNo: provider.phoneNo?.phoneNumber,
                imageUrl: provider.imageUrl,
                status: provider.status
        }
        });
        return res.status(200).json({ success: true, data: providers });
    } catch (error) {
        console.error('Error fetching service providers:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const updateStatusProvider = async (req: any, res: any) => {
    const { status, providerId } = req.body;
    
    let providerStatus = '';  

    if (status) {
        providerStatus = 'approved';
    } else {
        providerStatus = 'rejected';
    }
 
    try {
        if(status){
            await ServiceProvider.findOneAndUpdate(
                { _id: providerId },   
                { status: providerStatus, isUserVerified : true },
                { new : true } 
            )
        }else{
            await ServiceProvider.findOneAndUpdate(
                { _id: providerId },   
                { status: providerStatus}, // no need to change the isuserverifed by default it is false
                { new : true }
            );
        }

        res.status(200).json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        console.error('Error updating service provider:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const storePhone = async (req : any, res : any) => {
    try {
        const { phoneNumber } = req.body;
        console.log(phoneNumber)
        const phoneNo = await PhoneNumber.findOne({phoneNumber}); 
        if(phoneNo){
            return res.status(400).json({data :{ message: "Phone number already stored."}});
        }
        const newPhoneNumber = new PhoneNumber({ phoneNumber });
        await newPhoneNumber.save();
        return res.status(200).json({data :{ message: "Phone number stored successfully."}});
    } catch (error) {
        console.error('Error storing phone number:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

export const addProvider = async (req : any, res : any) => {
    try {
        
        const { name, email, category, subcategory, address, aadharAddress, phone} = req.body;
        
        const imageUrl = req.fileUrls;
        
        const isUserVerifed = true;
        const status = "approved";
        const loggedInBefore = true;
        const phoneNo = await PhoneNumber.findOne({phoneNumber : phone});
        console.log("phone",phoneNo?._id)
        const providerExist = await ServiceProvider.findOne({email : email});

        if(providerExist){
            return res.status(400).json({ message: "Email is already registered." });
        }

        const providerData = { phoneNo : phoneNo?._id, name, email,category, subcategory, address, aadharAddress, imageUrl, isUserVerifed, status, loggedInBefore };
        
        if (!name || !email || !address || !category || !subcategory || !aadharAddress) {
            return res.status(500).json({ message: "Please provide all the required fields." });
        }

        const newServiceProvider = new ServiceProvider(providerData);  
        await newServiceProvider.save();

        res.status(200).json({data :{ message: "Service provider registered successfully." }});
    } catch (error) {
        console.error('Error adding service provider:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

export const updateProviderStatus = async (req : any, res : any) => {
    const { status } = req.body;
    const {id} = req.params;

    try {
        if(status == 'approved' && id != undefined){
            await ServiceProvider.findOneAndUpdate(
                { _id: id },   
                { status: status, isUserVerified : true },
                { new : true } 
            )
            return res.status(200).json({ success: true, message: 'successfully' });

        }else if(status == 'rejected' && id != undefined){
            await ServiceProvider.findOneAndUpdate(
                { _id: id },   
                { status: status, isUserVerified : false},
                { new : true }
            );
            return res.status(200).json({ success: true, message: 'successfully' });
        }
        return res.status(500).json({ success: false, message: 'something went wrong' });
    } catch (error) {
        console.error('Error updating service provider:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}  


export const addCategory = async (req : any, res : any) => {
    try {
        const { category, subcategories } = req.body;

        const categoryExist = await Category.findOne({category : category});

        if(categoryExist){
            return res.status(400).json({data :{ message: "Category already exist."}});
        }
        const categoryData = { category, subcategories };
        const newCategory = new Category(categoryData);
        await newCategory.save();
        return res.status(200).json({data :{ message: "Category added successfully."}});
    } catch (error) {
        console.error('Error adding category:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}


export const seeAllCategory = async (req : any, res : any) => {
    try {
        const categories = await Category.find();
        return res.status(200).json({ success: true, data: categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const deleteCategory = async (req : any, res : any) => {
    try {
        const { id } = req.params;
        await Category.findByIdAndDelete(id);
        return res.status(200).json({data :{ message: "Category deleted successfully."}});
    } catch (error) {
        console.error('Error deleting category:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}


export const getProviderInfo = async (req : any, res : any) => {
    try {
        const providers = await ServiceProvider.find({}).populate('phoneNo');
        return res.status(200).json({ success: true, data: providers });
    } catch (error) {
        console.error('Error fetching service providers:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};