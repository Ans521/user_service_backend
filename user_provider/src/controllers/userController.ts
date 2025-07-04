import { connectDb } from "../config/db";
import PhoneNumber from "../models/phoneEmail";
import { User } from "../models/user";
import { ServiceProvider } from "../models/serviceProvider";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';
import dotenv, { populate } from 'dotenv';
import path from 'path';
import multer from "multer";
import fs from 'fs';
import { createClient } from 'redis';
import { Category } from "../models/categorySchema";
import { SubCategory } from "../models/subCategory";
import { imagesKey } from "../shortObj";
import { start } from "repl";
import { Types } from "mongoose";
import { sendNotification, userSocketMap } from "./socket";
import { Socket } from "socket.io-client";
import { time, timeStamp } from "console";
import { Base } from "../models/baseSchema";
import { sendPush } from "../utils/redisUtils"
import { Request } from "express";

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

const redisOperation = async (phone: string, otp: number, toStore: boolean = true) => {
    if (toStore) {
        await client.setEx(`otp:${phone}`, 600, otp.toString());
        await client.setEx(`phone:${otp}`, 600, phone.toString());
    } else {
        await client.del(`phone:${otp}`)
        await client.del(`otp:${phone}`)
    }
}

export const getOtp = async (req: any, res: any) => {
    try {
        const { phone, email } = req.body;
        if (!phone || !email) {
            return res.status(400).json({ message: "Please provide phone number and email" })
        }
        // const otp = Math.floor(1000 + Math.random() * 9999);
        const otp: number = 1111;
        const response = await PhoneNumber.findOne({ phoneNumber: phone, email })

        //user enter the phone number checking that is in the mongodb or not
        if (!response) {
            const responseEmail = await PhoneNumber.findOne({ email })
            const responsePhone = await PhoneNumber.findOne({ phoneNumber: phone })

            if (responseEmail || responsePhone) {
                return res.status(400).json({ message: "Phone number or email already exist in another account" })
            }

            await new PhoneNumber({ phoneNumber: phone, email }).save()
            await redisOperation(email, otp)
            return res.status(200).json({ data: { message: "otp generated", otp } });
        } else {
            // if phone number is found in mongodb
            const otpRedis = await client.get(`otp:${email}`)
            // const phoneNo = response.phoneNumber;
            const providerEmail = response.email;
            if (!otpRedis) {
                await redisOperation(providerEmail, otp)
                return res.status(200).json({ data: { message: "otp generated", otp } })
            }
            return res.status(200).json({ data: { message: "fetched otp", otpRedis } })
        }
    } catch (error) {
        return res.status(500).send(error);
    }
};

export const verifyOtp = async (req: any, res: any) => {
    try {
        const { userOtp, isEmployeeLogin, deviceToken } = req.body;
        console.log("typeof isEmployeeLogin", typeof isEmployeeLogin)
        if (!userOtp || typeof isEmployeeLogin === 'undefined' || !deviceToken) {
            return res.status(400).json({ message: "Invalid Otp or Type of isEmplyoeeLogin or deviceToken" });
        }

        const phoneNo1 = await client.get(`phone:${userOtp}`);
        if (!phoneNo1) {
            return res.status(404).json({ message: "Invalid OTP or OTP Expired" });
        }

        const storedOtp = await client.get(`otp:${phoneNo1}`);

        if (storedOtp !== userOtp) {
            return res.status(400).json({ data: { message: "Enter valid OTP", userOtp } });
        }

        // const phoneRef = await PhoneNumber.findOne({ phoneNumber: String(phoneNo1) });
        const phoneRef = await PhoneNumber.findOne({ email: phoneNo1 });

        if (!phoneRef) {
            return res.status(404).json({ message: "No phone reference found" });
        }

        const existingRole = await Base.findOne({ phoneNo: phoneRef?._id }).select("role").lean();


        const currentRole = existingRole?.role;

        if (currentRole) {
            const isExpectedRole = isEmployeeLogin ? "serviceProvider" : "User";
            if (currentRole.toLowerCase() !== isExpectedRole.toLowerCase()) {
                if (currentRole !== "serviceProvider") {
                    return res.status(400).json({ message: `You are not a ${isExpectedRole}` });
                }
            }
        }
        if (!isEmployeeLogin) {
            const userData: any = await User.findOne({ phoneNo: phoneRef?._id }).populate('phoneNo').populate('email');
            if (userData?.loggedInBefore) {
                redisOperation(phoneNo1, userOtp, false);

                const sentData = {
                    _id: userData?._id,
                    name: userData?.name || "John Doe",
                    address: userData?.address || "123 Main St",
                    email: userData?.phoneNo?.email || "ZVv7Q@example.com",
                    phone: userData?.phoneNo?.phoneNumber || "123-456-7890",
                    loggedInBefore: userData?.loggedInBefore
                }
                await User.updateOne({ _id: userData._id }, { deviceToken });

                const token = jwt.sign({ id: phoneRef?._id.toString(), isEmployeeLogin: false }, secretKey, { expiresIn: '12h' })

                return res.status(200).json({
                    message: "User logged in before",
                    data: sentData,
                    token: token
                });
            } else {
                try {
                    const newUser: any = await new User({ phoneNo: phoneRef?._id, deviceToken }).save();
                    const sentData = {
                        _id: newUser?._id,
                        role: newUser?.role,
                        phone: phoneRef?.phoneNumber,
                        email: phoneRef?.email,
                        loggedInBefore: newUser?.loggedInBefore,
                    }
                    redisOperation(phoneNo1, userOtp, false);
                    return res.status(200).json({ message: "User logging in for the first time", data: sentData });
                } catch (error) {
                    console.log(error);
                    return res.status(500).json({ message: "Error occurred while saving new user" });
                }
            }
        } else {
            const providerData: any = await ServiceProvider.findOne({ phoneNo: phoneRef }).populate('phoneNo').populate('email')
            const sentData = {
                _id: providerData?._id,
                name: providerData?.name || "John Doe",
                address: providerData?.address || "123 Main St",
                email: providerData?.phoneNo?.email || "ZVv7Q@example.com",
                phone: providerData?.phoneNo?.phoneNumber || "123-456-7890",
                loggedInBefore: providerData?.loggedInBefore,
                isUserVerified: providerData?.isUserVerifed || false,
                isProfileCompleted: providerData?.isProfileCompleted || false
            }

            if (providerData?.loggedInBefore) {
                await ServiceProvider.updateOne({ _id: providerData._id }, { deviceToken });
                if (providerData?.isUserVerifed) {
                    redisOperation(phoneNo1, userOtp, false);
                    const token = jwt.sign({ id: phoneRef?._id.toString(), isEmployeeLogin: true }, secretKey, { expiresIn: '12h' })
                    return res.status(200).json({
                        message: "Service provider verified",
                        data: sentData,
                        token: token
                    });
                } else {
                    redisOperation(phoneNo1, userOtp, false);
                    const token = jwt.sign({ id: phoneRef?._id.toString(), isEmployeeLogin: true }, secretKey, { expiresIn: '12h' })
                    return res.status(200).json({
                        message: "Service provider logged in before but not verified yet by admin",
                        data: sentData,
                        token: token
                    });
                }
            } else {
                try {
                    const existingProvider: any = await ServiceProvider.findOne({ phoneNo: phoneRef?._id, email: phoneRef?._id })
                    if (existingProvider) {
                        redisOperation(phoneNo1, userOtp, false);
                        return res.status(200).json({ message: "Provider stored in Db", data: existingProvider });
                    }
                    const newProvider: any = await new ServiceProvider({ phoneNo: phoneRef?._id, email: phoneRef?._id, deviceToken }).save();
                    const sentData = {
                        _id: newProvider?._id,
                        loggedInBefore: newProvider?.loggedInBefore,
                        isUserVerified: newProvider?.isUserVerifed,
                        isProfileCompleted: newProvider?.isProfileCompleted
                    }
                    redisOperation(phoneNo1, userOtp, false);
                    return res.status(200).json({ message: "New service provider logged in", data: sentData });
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

export const registerUser = async (req: any, res: any) => {
    const { name, email, address, mpin, phone } = req.body;

    if (!name || !email || !address || !phone) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        const userData: any = await PhoneNumber.findOne({ phoneNumber: phone, email: email });
        console.log("userData", userData)

        if (!userData) {
            return res.status(404).json({ message: "Phone Number and email has not been stored" })
        }

        // const responseEmail = await PhoneNumber.findOne({email})
        // const responsePhone = await PhoneNumber.findOne({phoneNumber : phone})

        // if(responseEmail || responsePhone){
        //     return res.status(400).json({message : "Phone number or email already exist"})
        // }
        // if (existingUser) {
        //     return res.status(400).json({ message: "Email is already registered." });
        // }

        const phoneNoId = userData?._id;

        const loggedInBefore = true;
        const registerData: any = { name, email: phoneNoId, address, loggedInBefore }

        if (mpin && typeof mpin === "string") {
            const hashedMpin = await bcrypt.hash(mpin, 10);
            registerData.mpin = hashedMpin;
        }

        const newUser = await User.findOneAndUpdate(
            { phoneNo: phoneNoId },
            { $set: registerData },
            { new: true }
        ).select('-__v -userMsg');

        const token = jwt.sign({ id: phoneNoId.toString(), isEmployeeLogin: false }, secretKey, { expiresIn: '12h' })
        return res.status(200).json({
            message: "User registered successfully",
            data: newUser,
            token: token
        });
    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: "An error occurred, please try again later" });
    }
}


export const registerProvider = async (req: any, res: any) => {
    const { name, email, address, address2, category, subcategory, phone }: { name: string; email: string; address: string; address2?: string, category?: string, subcategory?: string, phone: string } = req.body;

    if (!name || !email || !address || !phone || !category || !subcategory) {
        return res.status(400).json({ message: "Provide all the fields" });
    }

    // const existingEmail = await ServiceProvider.findOne({ email });

    // if (existingEmail) {
    //     return res.status(400).json({ message: "Email is already registered" });
    // }

    // const userData: any = await PhoneNumber.findOne({ phoneNumber: phone });

    // if (!userData) {
    //     return res.status(404).json({ message: "Phone number not found" });
    // }

    const userData: any = await PhoneNumber.findOne({ phoneNumber: phone, email: email });

    if (!userData) {
        const existingEmail = await PhoneNumber.findOne({ email });

        if (existingEmail) {
            return res.status(400).json({ message: "Email and phone no is already registered by another user" });
        }

        return res.status(404).json({ message: "Phone Number has not been stored" })
    }

    const phoneNoId = userData?._id;
    const categoryId = await Category.findOne({ category });
    console.log("subcategory", subcategory)
    const subcategoryId = await SubCategory.findOne({ name: subcategory });

    console.log("categoryId", categoryId);
    console.log("subcategoryId", subcategoryId);

    if (!categoryId || !subcategoryId) {
        return res.status(404).json({ message: "Category or subcategory not found" })
    }

    try {
        const serviceProviderData: any = { name, email: phoneNoId, address, aadharAddress: address2, phoneNo: phoneNoId, category: categoryId?._id, subcategory: subcategoryId?._id };

        const newServiceProvider: any = await ServiceProvider.findOneAndUpdate(
            { phoneNo: phoneNoId },
            { $set: serviceProviderData },
            { new: true }
        ).select('-phoneNo -email -workingHours -workingDays -avgRating -totalReviews -experience -totalDelivery -aboutUs -galleryImages -__v -servicePrice -reviewComments -services -enquiry');
        const sentData = {
            ...newServiceProvider?.toObject(),
            phone,
            email
        }
        return res.status(200).json({
            message: "Provider registered successfully",
            data: sentData,
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "An error occurred, please try again later" });
    }
};

const directoryPath = path.join(__dirname, '../../uploads');
if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath);
}

const uploadImage = multer.diskStorage({
    destination: function (req: any, file, cb) {
        cb(null, directoryPath)
    },

    filename: function (req: any, file, cb) {
        console.log("filename", file)
        const fileName = Date.now() + path.extname(file.originalname)
        cb(null, fileName)
    }
})

export const uploadMultiple = multer({ storage: uploadImage }).fields([
    { name: imagesKey.aadharCard, maxCount: 1 },
    { name: imagesKey.aadharCardBack, maxCount: 1 },
    { name: imagesKey.panCard, maxCount: 1 },
    { name: imagesKey.photo, maxCount: 1 },
]);

export const upload = multer({ storage: uploadImage })

export const handleSingleImageUrl = async (req: any, res: any) => {
    try {
        if (!req.file) {
            return res.status(400).send("No file uploaded.");
        }

        const fileUrl = `http://localhost:4000/uploads/${req.file.filename}`

        console.log("fileUrl", fileUrl)

        return res.status(200).json({ message: "File uploaded successfully", data: fileUrl });

    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: "An error occurred, please try again later" });
    }
}


export const handleImageUrls = async (req: any, res: any) => {
    try {
        const { phone, email, imageUrl } = req.body;

        if (!phone || !email || !imageUrl) {
            return res.status(400).json({ message: "Please provide required field" });
        }

        const phoneData = await PhoneNumber.findOne({ phoneNumber: phone, email });

        if (!phoneData) {
            return res.status(404).json({ message: "Phone number not found." });
        }

        const isUserVerifed = false;
        const isloggedInBefore = true;
        const providerData: any = await ServiceProvider.findOneAndUpdate(
            { phoneNo: phoneData?._id },
            {
                $set: {
                    imageUrl,
                    isUserVerifed,
                    loggedInBefore: isloggedInBefore
                }
            }, { new: true }
        ).select('-phoneNo -email -workingHours -workingDays -avgRating -totalReviews -experience -totalDelivery -aboutUs -galleryImages');

        const token: string = jwt.sign({ id: phoneData?._id.toString(), isEmployeeLogin: true }, secretKey, { expiresIn: '12h' });
        const sentData = {
            ...providerData.toObject(),
            phone,
            email
        }
        return res.status(200).json({
            message: "URLs updated successfully.",
            data: sentData,
            token: token
        });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error.", error: err });
    }
};

export const getProviderList = async (req: any, res: any) => {
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


export const storePhone = async (req: any, res: any) => {
    try {
        const { phoneNumber, email } = req.body;
        console.log(phoneNumber, email)
        const existingProvider = await PhoneNumber.findOne({ phoneNumber, email });

        const existingPhone = await PhoneNumber.findOne({ phoneNumber });
        const existingEmail = await PhoneNumber.findOne({ email });

        if (existingProvider) {
            return res.status(400).json({ data: { message: "These phoneNumber and email already stored." } });
        }

        if (existingPhone || existingEmail) {
            return res.status(400).json({ data: { message: "Phone number or email already exist." } });
        }

        await PhoneNumber.create({ phoneNumber, email });
        return res.status(200).json({ message: "Phone number stored successfully." });
    } catch (error) {
        console.error('Error storing phone number:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

export const addProvider = async (req: any, res: any) => {
    try {
        const { name, email, category, subcategory, address, aadharAddress, phone } = req.body;

        if (!req.files) {
            return res.status(400).send("No file uploaded.");
        }

        const files: any = {};

        if (req.files.AC) {
            files["AC"] = `http://localhost:4000/uploads/${req.files.AC[0].filename}`
        }

        if (req.files.ACB) {
            files["ACB"] = `http://localhost:4000/uploads/${req.files.ACB[0].filename}`
        }

        if (req.files.PC) {
            files["PC"] = `http://localhost:4000/uploads/${req.files.PC[0].filename}`
        }

        if (req.files.PH) {
            files["PH"] = `http://localhost:4000/uploads/${req.files.PH[0].filename}`
        }

        const isUserVerifed = true;
        const status = "approved";
        const loggedInBefore = true;
        const phoneNo = await PhoneNumber.findOne({ phoneNumber: phone });

        const providerExist = await ServiceProvider.findOne({ email: email });

        if (providerExist) {
            return res.status(400).json({ message: "Email is already registered." });
        }
        if (!name || !email || !address || !category || !subcategory || !aadharAddress) {
            return res.status(500).json({ message: "Please provide all the required fields." });
        }

        const catResponse = await Category.findOne({ category });
        const categoryId = catResponse?._id;

        const subCatResponse = await SubCategory.findOne({ subcategory });
        const subcategoryId = subCatResponse?._id;

        const providerData = { phoneNo: phoneNo?._id, name, email, category: categoryId, subcategory: subcategoryId, address, aadharAddress, files, isUserVerifed, status, loggedInBefore };

        const newServiceProvider = new ServiceProvider(providerData);
        await newServiceProvider.save();

        res.status(200).json({ message: "Service provider registered successfully." });
    } catch (error) {
        console.error('Error adding service provider:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

export const updateProviderStatus = async (req: any, res: any) => {
    const { status } = req.body;
    const { id } = req.params;
    const socketId = userSocketMap.get(id);
    console.log("socketId", socketId)
    const message = `Your account has been ${status} by admin.`;
    console.log("message", message)
    try {
        if (status == 'approved' && id != undefined) {
            await ServiceProvider.findOneAndUpdate(
                { _id: id },
                { status: status, isUserVerifed: true },
                { new: true }
            )
            sendNotification(socketId, message);
            return res.status(200).json({ success: true, message: 'successfully' });
        } else if (status == 'rejected' && id != undefined) {
            await ServiceProvider.findOneAndUpdate(
                { _id: id },
                { status: status, isUserVerifed: false },
                { new: true }
            );
            sendNotification(socketId, message);
            return res.status(200).json({ success: true, message: 'successfully' });
        }
        return res.status(500).json({ success: false, message: 'something went wrong' });
    } catch (error) {
        console.error('Error updating service provider:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const addCategory = async (req: any, res: any) => {
    try {
        const { category, subcategories } = req.body;
        const categoryExist = await Category.findOne({ category: category });

        if (categoryExist) {
            return res.status(400).json({ data: { message: "Category already exist." } });
        }

        const categoryData = { category };
        console.log("categoryData", categoryData)
        const newCategory = new Category(categoryData);
        await newCategory.save();
        console.log("subcategories", subcategories)
        const subcategoryData = subcategories.map((subcat: any) => ({
            name: subcat?.name,
            category: newCategory._id,
            image: subcat?.image || "not provided",
        }))

        console.log("subcategoryData", subcategoryData);

        await SubCategory.insertMany(subcategoryData);
        return res.status(200).json({ message: "Category added successfully." });
    } catch (error) {
        console.error('Error adding category:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}


export const seeAllCategory = async (req: any, res: any) => {
    try {
        const categories = await Category.find();
        const subcategories = await SubCategory.find().select('_id name category image iconImage');
        const filteredSubcategories = subcategories.map(({ _doc, ...remaining }: any) => _doc ? { name: _doc.name, _id: _doc._id, image: _doc?.image, iconImage: _doc?.iconImage } : { name: "", _id: "" });
        const response = await Promise.all(categories.map(async (cat: any) => ({
            category: cat?._doc.category,
            _id: cat?._doc._id,
            subcategories: subcategories?.filter((subcat: any) => subcat?.category?.toString() == cat?._id.toString()).map(({ _doc, ...remaining }: any) => _doc ? { name: _doc.name, _id: _doc._id, image: _doc?.image, iconImage: _doc?.iconImage } : { name: "", _id: "" })
        })))
        const sendData = categories.map((cat: any) => ({
            _id: cat._id,
            category: cat?.category,
        }))
        return res.status(200).json({ success: true, data: response, category: sendData, subcategories: filteredSubcategories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const deleteCategory = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        await Category.findByIdAndDelete(id);
        return res.status(200).json({ data: { message: "Category deleted successfully." } });
    } catch (error) {
        console.error('Error deleting category:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

// export const getProviderWithCategory = async (req : any, res : any) => {
//     const {limit, page} = req.query;
//     if(!page || !limit) return res.status(401).json({ success: false, message: 'page and limt is required' });  
//     const pageNumber = parseInt(page) || 1;     
//     const limitNumber = parseInt(limit) || 10;

//     const {rating, subcat, minPrice, maxPrice, search} = req.body;

//     const query : any = {
//         status : 'approved',
//     };

//     // $in humesa object mei rakh kr match hota hai ...... subcat : {$in : ["value", "value", "value"]} 
//     if(rating){
//         query.avgRating = {$gte : rating};
//     }

//     if(minPrice && maxPrice){
//         query.servicePrice = {$gte : minPrice, $lte : maxPrice};
//     }

//     const skip = (pageNumber - 1) * 10;

//     if(search){  
//         const subcatIds = await SubCategory.find({ name: { $regex: search, $options: 'i' } }).select('_id');
//         console.log(subcatIds)
//         const subcategoriesIds = subcatIds.map((subcat : any) => subcat?._id);
//         query.subcategory = { $in : subcategoriesIds };
//     }
//     if(subcat){
//         if(!Array.isArray(subcat)) return res.status(400).json({data : {message : "Subcategory should be array."}});
//         const subcatObjectIds = subcat.map((sub : any) => new Types.ObjectId(String(sub)));

//         if(query.subcategory && query.subcategory.$in){
//             query.subcategory.$in = [
//                 ...query.subcategory.$in,
//                 ...subcatObjectIds            
//             ]
//         }else{
//             query.subcategory = {
//                 $in : subcatObjectIds
//             }
//         }
//     }

//     try {
//         const response = await ServiceProvider.find(query).populate(['phoneNo', 'category']).skip(skip).limit(limitNumber);
//         if(!response || response.length === 0) return res.status(404).json({data : {message : "No Provider found"}})
//         const providerWithCategory = await Promise.all(response.map(async (provider : any) => {
//             return {
//                 _id : provider?.id,
//                 name : provider.name || "John doe",
//                 category : provider?.category?.category || "Dual Electrical",
//                 rating : provider?.avgRating || 3.0,
//                 totalReviews : provider.totalReviews || 1200,
//                 experience : provider?.experience || 4,
//                 visitingTime : provider.visitingTime || "30 min", 
//                 phone : provider?.phoneNo?.phoneNumber,
//                 providerPic : provider?.imageUrl?.photo || "Not available in Db",
//                 price : provider.servicePrice || 100, 
//             };
//         }))
//         return res.status(200).json({data : {message : "Provider fetched with limit", providerWithCategory}})
//     } catch (error) {
//         console.log(error)
//         return res.status(500).json({ success: false, message: 'Failed to fetch the provider with category' });
//     }
// }



export const getProviderWithCategory = async (req: any, res: any) => {
    try {
        const { rating, subcat, minPrice, maxPrice, search } = req.body;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;


        if (page < 1 || limit < 1) {
            return res.status(400).json({ success: false, message: 'Page and limit must be greater than 0' });
        }
        let query: any = {
            status: 'approved',
        };

        if (rating && typeof rating === 'number') {
            query.avgRating = { $gte: rating }
        }

        if (minPrice && maxPrice) query.servicePrice = { $gte: minPrice, $lte: maxPrice };

        if (search && search.trim() !== "") {
            const subcatIds = await SubCategory.find({ name: { $regex: search, $options: 'i' } }).select('_id');
            const subcategoryIds = subcatIds.map((sub: any) => sub._id);
            query.subcategory = { $in: subcategoryIds };
        }

        if (subcat) {
            if (!Array.isArray(subcat)) {
                return res.status(400).json({ data: { message: "Subcate should be array of the subcat Ids or Id." } });
            }
            const subcatObjectIds = subcat.map((sub: any) => new Types.ObjectId(String(sub)));
            query.subcategory = { $in: subcatObjectIds };

            // if (query.subcategory && query.subcategory.$in) {
            //     // const existingIds = new Set(query.subcategory.$in.map((id: any) => id.toString()));

            //     // const newIds = subcatObjectIds.filter((id: any) => !existingIds.has(id.toString()));
            //     // ye comment wala run krne kii jrurt nhi hai kyukii subcat and search ek saath nahii aayenge search simple aagye and subcat filter mei aagye
            //     // newIds mei filter iss hisaab se lgya hai kii agr wo subcatObjectIds mei jo id hai or wo same existingIds mei bhi hai toh usse filter krdo

            //     query.subcategory.$in = [...query.subcategory.$in, ...newIds];

            // } else {
            // }
        }

        console.log("query", query)
        const providers = await ServiceProvider.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "category"
                }
            },
            { $unwind: "$category" },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    name: { $ifNull: ["$name", "John doe"] },
                    category: "$category.category",
                    avgRating: { $ifNull: ["$avgRating", 3.0] },
                    totalReviews: { $ifNull: ["$totalReviews", 1200] },
                    completedTasks: { $ifNull: ["$completedTasks", 0] },
                    workingDays: { $ifNull: ["$workingDays", ["EveryDay"]] },
                    experience: { $ifNull: ["$experience", 4] },
                    phone: 1,
                    providerPic: { $ifNull: ["$imageUrl.photo", "Not available in Db"] },
                    servicePrice: { $ifNull: ["$servicePrice", 100] },
                }
            }
        ]);

        if (providers.length === 0) {
            return res.status(200).json({ success: false, message: "No providers found" });
        }

        return res.status(200).json({ success: true, message: "Providers fetched successfully", data: providers });

    } catch (error) {
        console.error("Error occurred:", error);
        return res.status(500).json({ success: false, message: 'Failed to fetch the provider with category' });
    }
};

export const getProviderInfo = async (req: any, res: any) => {
    const { id } = req.query;
    try {
        // const newProvider = await ServiceProvider.findOneAndUpdate(
        //     { _id: id}, 
        //     {
        //       $push: { 
        //         reviewComments: { totalStar: 4, comment: "good service" }
        //       }
        //     },
        //     { new: true }
        //   );
        const provider: any = await ServiceProvider.findOne({ _id: id, status: "approved" }).populate(['phoneNo', 'email', 'category', 'subcategory']);

        if (provider) {
            if (provider?.services?.length == 0) {
                const services =
                    [
                        {
                            service: "Hair Services",
                            serviceList: ["Hair Cut, Styling, HairColoring, Hair Spa"]
                        },

                        {
                            service: "Skin Services",
                            serviceList: ["Facial, Styling, Anti-Aging, Face Spa"]
                        }
                    ]
                provider.services = services
            }
            const providerInfo = {
                _id: provider?.id,
                name: provider?.name || "John doe",
                avgRating: provider?.avgRating || 4.5,
                totalReviews: provider?.totalReviews || 1200,
                experience: provider.experience || 3,
                phone: provider?.phoneNo?.phoneNumber,
                providerPic: provider?.imageUrl?.PH || "Not available",
                completedTasks: provider.completedTasks || 0,
                workingHours: provider?.workingHours || { start: "10AM", end: "5PM" },
                workingDays: provider?.workingDays || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                aboutus: provider?.aboutUs || "The best service backend developer is Ansh",
                scanQrUrl: provider?.scanQrUrl || "http://82.180.144.143:4000/uploads/1747842657687.png",
                imageGallery: provider?.galleryImages || ["http://82.180.144.143:4000/uploads/1746613692666.png", "http://82.180.144.143:4000/uploads/1746613692666.png"],
                services: provider?.services
            };
            return res.status(200).json({ message: 'Fetched the provider info', data: providerInfo });
        } else {
            return res.status(401).json({ data: { message: 'Provided Id have no info' } });
        }
    } catch (error) {
        console.log("error", error)
        return res.status(500).json({ success: false, message: 'Failed to fetch the provider info' });
    }
}

export const updateProfile = async (req: any, res: any) => {
    const { name, email, phone, address, aboutUs, experience, workingHours, workingDays, visitingTime, scanQrUrl, servicePrice, profilePic } = req.body;

    const updateData: any = {};

    const { id, isEmployeeLogin } = req.user;

    const response: any = isEmployeeLogin ? await ServiceProvider.findOne({ phoneNo: id }).populate("phoneNo") : await User.findOne({ phoneNo: id }).populate("phoneNo");
    const phoneId = response?.phoneNo?._id.toString();

    if (phone || email) {
        const updateProviderData: any = {}
        if (phone) {
            const existingNumber: any = await PhoneNumber.findOne({ phoneNumber: phone })
            if (!existingNumber || existingNumber?._id.toString() == phoneId.toString()) {
                updateProviderData.phoneNumber = phone
            } else {
                return res.status(400).json({ message: "Phone number or email already exists in another account" });
            }
        }
        if (email) {
            const existingEmail: any = await PhoneNumber.findOne({ email })
            if (!existingEmail || existingEmail?._id.toString() == phoneId.toString()) {
                updateProviderData.email = email
            } else {
                return res.status(400).json({ message: "Email already exists in another account" });
            }
        }

        if (Object.keys(updateProviderData).length > 0) {
            await PhoneNumber.findOneAndUpdate(
                { _id: phoneId },
                { $set: updateProviderData },
                { new: true }
            )
        }
    }
    if (name) updateData.name = name;
    if (isEmployeeLogin) {
        if (aboutUs) updateData.aboutUs = aboutUs;
        if (experience) updateData.experience = experience;
        if (workingHours) updateData.workingHours = workingHours;
        if (workingDays) updateData.workingDays = workingDays;
        if (visitingTime) updateData.visitingTime = visitingTime;
        updateData.isProfileCompleted = true;
        if (scanQrUrl) updateData.scanQrUrl = scanQrUrl;
        if (servicePrice) updateData.servicePrice = servicePrice;
        if (profilePic) {
            updateData.imageUrl = {}
            updateData.imageUrl[imagesKey.photo] = profilePic
        };
        const updatedUser = await ServiceProvider.findOneAndUpdate(
            { phoneNo: id },
            { $set: updateData },
            { upsert: true, new: true }
        )
        return res.status(200).json({
            message: "User info updated successfully",
            data: updatedUser
        })
    } else {
        if (address) updateData.address = address;
        if (profilePic) updateData.profilePic = profilePic;

        const updatedUser = await User.findOneAndUpdate(
            { phoneNo: id },
            { $set: updateData },
            { upsert: true, new: true }
        )
        return res.status(200).json({
            message: "User info updated successfully",
            data: updatedUser
        })
    }
}

export const getInfoUserProvider = async (req: any, res: any) => {
    try {
        const { id } = req.user;
        console.log("id", id)

        const findId = new Types.ObjectId(String(id))
        console.log("findId", findId)

        const { isEmployeeLogin } = req.user;

        console.log(isEmployeeLogin)

        if (isEmployeeLogin) {
            const provider: any = await ServiceProvider.findOne({ phoneNo: findId })
                .populate(['phoneNo', 'email', 'category', 'subcategory']);

            if (!provider) {
                return res.status(404).json({ message: "No provider found" });
            }
            if (provider?.services?.length === 0) {
                provider.services = [{ service: "Hair Services", serviceList: ["Hair Cut, Styling, HairColoring, Hair Spa"] }, { service: "Skin Services", serviceList: ["Facial, Styling, Anti-Aging, Face Spa"] }]
            }
            const providerData = {
                name: provider?.name || "John Doe",
                providerPic: provider?.imageUrl?.PH || "",
                address: provider?.address || "123 Main St",
                email: provider?.phoneNo?.email || "ZVv7Q@example.com",
                phone: provider?.phoneNo?.phoneNumber || "123-456-7890",
                aboutus: provider?.aboutUs || "Hiii I am a service provider",
                isUserVerified: provider?.isUserVerifed || false,
                isProfileCompleted: provider?.isProfileCompleted || false,
                experience: provider?.experience || 4,
                workingHrs: provider?.workingHours || { start: "10AM", end: "5PM" },
                role: provider?.role || "ServiceProvider",
                isEmployeeLogin: provider?.isEmployeeLogin || true,
                workingDays: provider?.workingDays || "Everyday",
                visitingTime: provider?.visitingTime || "30 min",
                servicePrice: provider?.servicePrice || 100,
                scanQrUrl: provider?.scanQrUrl || "http://82.180.144.143:4000/uploads/1747842657687.png",
                services: provider?.services,
                imageGallery: provider?.galleryImages || ["http://82.180.144.143:4000/uploads/1747842657687.png", "http://82.180.144.143:4000/uploads/1746613692666.png"],
            }

            return res.status(200).json({ message: 'Fetched the provider info', data: providerData });
        } else {
            const user: any = await User.findOne({ phoneNo: findId }).populate(['phoneNo', 'email']);
            if (!user) {
                return res.status(404).json({ message: "No user found" });
            }
            const userData = {
                name: user?.name || "John Doe",
                address: user?.address || "123 Main St",
                email: user?.phoneNo?.email || "ZVv7Q@example.com",
                phone: user?.phoneNo?.phoneNumber || "123-456-7890",
                role: user?.role || "User",
                isEmployeeLogin: user?.isEmployeeLogin || false,
            }
            return res.status(200).json({ message: 'Fetched the user info', data: userData });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch user info' });
    }
};


// export const searchProvider = async (req : any, res : any) => {
//     try {
//         const { search } = req.body;
//         console.log("search", search)   
//         // agr mei chahta hu kii user chahe phn number fill kree ya fir email kuch bhi then i can use $or to search across multiple field.
//         //  $or is used to search across multiple fields
//         const providers : any = await SubCategory.find({
//                 name: { $regex: search, $options: 'i' },
//                 // { address: { $regex: search, $options: 'i' } },
//         })
//         const searchData = await Promise.all(providers.map(async(provider : any) => {
//             const providerInfo : any = await ServiceProvider.findOne({ subcategory : provider._id, status : "approved" })
//             if(providerInfo){
//                 return {
//                     _id : providerInfo?.id,
//                     name : providerInfo?.name,
//                     providerPic : providerInfo?.imageUrl?.PH,
//                     phone : providerInfo?.phoneNo?.phoneNumber,
//                     review : providerInfo?.avgRating || 2,
//                     price : providerInfo?.servicePrice || 100,
//                     totalReviews : providerInfo?.totalReviews || 0,
//                     experience : providerInfo?.experience || 0,
//                     workingHrs : providerInfo?.workingHours || {start : "10AM", end : "5PM"},
//                     workingDays : providerInfo?.workingDays || "Everyday",
//                     visitingTime : providerInfo?.visitingTime || "30 min",
//                 }
//             }else{
//                 return null
//             }
//         }))

//         const searchedData = searchData.filter((provider : any) => provider !== null)

//         return res.status(200).json({ data: { message: 'Fetched the provider info', searchedData } });
//     }catch (error) {
//         return res.status(500).json({ success: false, message: 'Failed to fetch user info' });
//     }
// }   

export const userSentMsg = async (req: any, res: any) => {
    try {
        const { message } = req.body;
        const { receiverId } = req.query; // recevier Id; // kiske pe jaa raha hai
        const { id } = req.user; // sender Id; // kon bhej raha hai

        if (!Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({ success: false, message: 'Invalid provider id' });
        }

        const provider: any = await ServiceProvider.findOne({ _id: receiverId });

        if (!provider) {
            return res.status(404).json({ message: "Provider id provided is wrong" });
        }

        const userMessage = {
            message: message,
            timeStamp: new Date(),
        };

        const senderId = new Types.ObjectId(String(id));
        const senderData: any = await Base.findOneAndUpdate({ phoneNo: senderId }).select("name").lean();

        const serviceData: any = await ServiceProvider.findOne({
            _id: receiverId,
            'enquiry.sender': senderId,
        });

        const deviceToken = senderData?.deviceToken || "";
        sendPush(message, senderData.name, deviceToken);


        if (serviceData) {
            // sender already exists → push new message
            await ServiceProvider.findOneAndUpdate(
                { _id: receiverId, 'enquiry.sender': senderId },
                {
                    // is enquiry.$.messages ka mtlb hai kii enquiry array mei jo messages hai usme ye new message push krdo
                    $push: { 'enquiry.$.messages': userMessage },
                },
                { new: true }
            );
        } else {
            // new sender → push a new enquiry object
            await ServiceProvider.findByIdAndUpdate(
                receiverId,
                {
                    $push: {
                        enquiry: {
                            sender: id,
                            messages: userMessage,
                        },
                    },
                },
                { new: true }
            );
        }

        // For User side (userMsg list) // this is for kii user ne kiis ko msg kiye hai
        const userData: any = await User.findOne({
            phoneNo: senderId,
            'userMsg.receiverId': receiverId,
        });

        if (userData) {
            await User.findOneAndUpdate(
                { phoneNo: senderId, 'userMsg.receiverId': receiverId },
                {
                    $push: { 'userMsg.$.messages': userMessage },
                },
                { new: true }
            );
        } else {
            await User.findOneAndUpdate(
                { phoneNo: senderId },
                {
                    $push: {
                        userMsg: {
                            receiverId: receiverId,
                            messages: userMessage,
                        },
                    },
                },
                { new: true }
            );
        }
        return res.status(200).json({ data: { message: 'Message sent successfully' } });
    } catch (error) {
        console.log("error", error);
        return res.status(500).json({ success: false, message: 'Failed to send message' });
    }
};

type EnquiryType = {
    type: 'phone' | 'email' | 'chat',
    providerId: string,
}

interface AuthenticatedRequest extends Request<{}, any, EnquiryType> {
    user: {
        id: string;
    }
}

