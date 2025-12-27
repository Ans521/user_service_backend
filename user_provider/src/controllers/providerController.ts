import { ServiceProvider } from "../models/serviceProvider";
import { Types } from "mongoose";
import { SubCategory } from "../models/subCategory";
import { Category } from "../models/categorySchema";
import { Banner } from "../models/banner";
import { Request, response } from "express";
import { Offer } from "../models/offer";
import { Base } from "../models/baseSchema";
import { sendPush, sendPushToAll } from "../utils/redisUtils";
import { PushPayload } from "../types/notification.type";
import { User } from "../models/user";
import { Order } from "../models/order";
import { Notify } from "../models/notification";
import { NotifyBell } from "../models/notifiybell";

export const uploadImages = async (req: any, res: any) => {
    try {
        const { id, isEmployeeLogin } = req.user;

        if (!isEmployeeLogin || !id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const imageUrlObj = req.files;

        if (!imageUrlObj) {
            return res.status(400).json({ success: false, message: 'uploadImageUrl is required' });
        }
        const imageUrls = imageUrlObj.map((file: any) => `http://82.180.144.143:4000/uploads/${file.filename}`);

        if (imageUrls.length === 0) {
            return res.status(400).json({ success: false, message: 'No images uploaded' });
        }

        const phoneNoId = new Types.ObjectId(String(id));
        const galleryImagesCheck: any = await ServiceProvider.findOne({ phoneNo: phoneNoId }).select('galleryImages');

        // if(galleryImagesCheck?.galleryImages?.length >= 6) {
        //     return res.status(400).json({ success: false, message: 'You can only upload 6 images' });
        // }

        const providerImages: any = await ServiceProvider.findOneAndUpdate(
            { phoneNo: phoneNoId },
            { $push: { galleryImages: { $each: imageUrls } } },
            { new: true }
        )

        return res.status(200).json({ success: true, message: 'Images uploaded successfully', data: providerImages });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const addSpecialCategory = async (req: any, res: any) => {
    try {
        console.log("req.body", req.body)
        const { data } = req.body;
        if (!data || data.length === 0) {
            return res.status(400).json({ success: false, message: 'data is required' });
        }
        const operations = data.map((item: any) => {
            return {
                updateOne: {
                    filter: { _id: item.subcategoryId },
                    update: {
                        $set: {
                            iconImage: item.iconImage,
                            specialCategory: true
                        }
                    }
                }
            }
        })

        const result: any = await SubCategory.bulkWrite(operations);
        console.log("result", result);
        return res.status(200).json({ success: true, message: 'subcat added successfully' });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const getAddedSpecialCateogory = async (req: any, res: any) => {
    try {
        const data = await SubCategory.find({ specialCategory: true }).select('-__v');
        if (!data || data.length === 0) {
            return res.status(400).json({ success: false, message: 'No data found' });
        }
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const updateCategory = async (req: any, res: any) => {
    try {
        const { category, categoryId, subcategories } = req.body;
        const categoryIds = new Types.ObjectId(categoryId as string);
        console.log("categoryIds", categoryIds);

        const response = await Category.findOneAndUpdate(
            { _id: categoryId },
            { category },
            { new: true },
        )
        console.log("response", response);
        if (!response) {
            return res.status(400).json({ success: false, message: 'Category not found' });
        }
        // Promise.all() is used here to wait for all the async operations (findOneAndUpdate or create) inside .map() to finish before moving on.
        // Without Promise.all(), the function won’t wait for all awaits in the .map() loop — it might finish early and cause unexpected results or incomplete DB writes.
        await Promise.all(subcategories.map(async (item: any) => {
            if (item.subcategoryId) {
                const subcategoryIds = new Types.ObjectId(item.subcategoryId as string);
                console.log("subcategoryIds", subcategoryIds);
                await SubCategory.findOneAndUpdate(
                    { _id: subcategoryIds },
                    { name: item.name, image: item.image, category: categoryIds },
                    { new: true, upsert: true },
                )
            } else {
                await SubCategory.create({ name: item.name, image: item.image, category: categoryIds })
            }
        }))
        return res.status(200).json({ success: true, message: 'Category updated successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const removeSpecialCategory = async (req: any, res: any) => {
    try {
        console.log("req.body", req.body)
        const { subcategoryId, specialCategory } = req.body;

        const response = await SubCategory.findOneAndUpdate(
            { _id: subcategoryId },
            { specialCategory: specialCategory },
            { new: true },
        )
        if (!response) {
            return res.status(400).json({ success: false, message: 'Subcategory not found' });
        }
        return res.status(200).json({ success: true, message: 'Subcategory updated successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const addBanner = async (req: any, res: any) => {
    try {
        const { data } = req.body;

        const {banner, bannerNotify} = data;
        
        if (!banner || banner.length === 0) {
            return res.status(400).json({ success: false, message: 'data is required' });
        }

        const result = await Banner.insertMany(banner);


        // if (bannerNotify.length > 1) {
        //     sendPushToAll("New Banners Added 🎉", `Check out the latest ${bannerNotify.length} banners in our app.`, bannerNotify[0].imageUrl, "allUsers")
        // } else if (bannerNotify.length === 1) {
        //     sendPushToAll(bannerNotify[0].tittle, bannerNotify[0].message, bannerNotify[0].imageUrl, "allUsers")
        // }

        return res.status(200).json({ success: true, message: 'Banner added successfully', data: result });
    } catch {
        return res.status(200).json({ success: false, message: 'Banner not Added' });
    }
}

export const getAllBanner = async (req: any, res: any) => {
    try {
        const { position } = req.query;
        // const { id } = req.user;
        if (!position) {
            return res.status(400).json({ success: false, message: 'position is required' });
        }

        let banners;
        if (position == 'all') {
            banners = await Banner.find().lean();
        } else {
            banners = await Banner.find({ position }).lean();
        }
        if (banners && banners.length === 0) {
            return res.status(400).json({ success: false, message: 'No banner found' });
        }
        const validBanners = (banners as any[]).filter(
            (banner: any) =>
                banner.imageUrl && banner.link && banner.imageUrl?.trim() !== "" && banner.link?.trim() !== ""
        );

        // const providerIdObj = new Types.ObjectId(String(id));
        if (position === 'all') {
            // const order: any = await Order.findOne({
            //     providerId: providerIdObj,
            //     status: "paid",
            //     isActive: true
            // }).sort({ endDate: -1 }).lean();

            // if(order){
            //     if (order.endDate < new Date()) {
            //     await Order.findOneAndUpdate({
            //         serviceProviderId: providerIdObj,
            //     },
            //         {
            //             isActive: false,
            //         })

            //     await ServiceProvider.updateOne(
            //         { phoneNo: providerIdObj },
            //         { $unset: { offerId: 1 } }
            //     )
            // }
            // }



            const topBanner = validBanners.filter((ban) => ban.position === 'top').map(({ _id, imageUrl, link }) => ({ _id, imageUrl, link }));

            const bottomBanner = validBanners.filter((ban) => ban.position === 'bottom').map(({ _id, imageUrl, link }) => ({ _id, imageUrl, link }));

            return res.status(200).json({ success: true, top: topBanner, bottom: bottomBanner });
        }

        const result = validBanners.map(({ _id, imageUrl, link }) => ({ _id, imageUrl, link }));

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("Error fetching banners:", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteBanner = async (req: any, res: any) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ success: false, message: 'id is required' });
    }

    try {
        const banner = await Banner.findByIdAndDelete(id);

        if (!banner) {
            return res.status(400).json({ success: false, message: 'Banner not found' });
        }

        return res.status(200).json({ success: true, message: 'Banner deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

export const updateBanner = async (req: any, res: any) => {
    try {
        const { data, position } = req.body;

        if (!data || data.length === 0) {
            return res.status(400).json({ success: false, message: 'data is required' });
        }

        const _id = data[0]._id;

        if (!_id) {
            return res.status(400).json({ success: false, message: 'id is required' });
        }

        const result = await Banner.findByIdAndUpdate(
            { _id },
            { imageUrl: data[0].imageUrl, link: data[0].link, position },
            { new: true }
        )

        return res.status(200).json({ success: true, message: 'Banner updated successfully', data: result });
    } catch (error) {
        console.log("error", error);
    }
}

export const bannerMain = async (req: any, res: any) => {
    try {
        const { id, isMain } = req.query;

        if (!id) {
            return res.status(400).json({ success: false, message: 'id is required' });
        }
        console.log("id", id, "isMain", isMain);

        const catId = new Types.ObjectId(String(id));
        const cat = await Category.findById(catId);

        if (!cat) {
            return res.status(400).json({ success: false, message: 'Banner not found' });
        }

        const response = await Category.updateOne(
            { _id: catId },
            { $set: { isMain: isMain } }
        );
        console.log("response", response);
        return res.status(200).json({ success: true, message: 'Banner updated successfully' });
    } catch (err) {
        console.error("Error updating banner:", err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}
export const setServiceList = async (req: any, res: any) => {
    try {
        const { service, serviceList } = req.body;
        if (!serviceList || !service || serviceList.length === 0) {
            return res.status(400).json({ success: false, message: 'serviceList is required' });
        }
        const { id } = req.user;
        if (!id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const services = {
            service,
            serviceList
        }
        const phoneNoId = new Types.ObjectId(String(id));
        const response = await ServiceProvider.findOneAndUpdate(
            { phoneNo: phoneNoId },
            { $push: { services } },
            { new: true, upsert: false },
        )
        if (!response) {
            return res.status(400).json({ success: false, message: 'Service provider not found' });
        }
        return res.status(200).json({ success: true, message: 'Service list updated successfully' });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const getServiceList = async (req: any, res: any) => {
    try {
        let providerId = "";
        if (req.query.id) {
            const { id } = req.query;
            providerId = id;
            console.log("in the query", providerId);
            const response = await ServiceProvider.findOne(
                { _id: providerId },
                { services: 1 },
            )

            if (!response) {
                return res.status(400).json({ success: false, message: 'Service List is not found' });
            }

            return res.status(200).json({ success: true, data: response });
        } else if (req.user && req.user.id) {
            const id = req.user.id;
            providerId = id;
            console.log("in the user", providerId);
            const phoneNoId = new Types.ObjectId(String(providerId));
            const response = await ServiceProvider.findOne(
                { phoneNo: phoneNoId },
                { services: 1 },
            )
            if (!response) {
                return res.status(400).json({ success: false, message: 'Service List is not found' });
            }
            return res.status(200).json({ success: true, data: response });
        } else {
            return res.status(400).json({ success: false, message: 'id is required' });
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const deleteService = async (req: any, res: any) => {
    try {
        const { serviceId } = req.query;

        const { id } = req.user
        if (!id) {
            return res.status(400).json({ success: false, message: 'unauthorized' });
        }
        // if(!Types.ObjectId.isValid(serviceId)) {
        //     return res.status(400).json({ success: false, message: 'Invalid service id' });
        //     // this is just to check that is this service provider ID is valid to convert in ObjectID it not then new types object id will return false 
        // }

        const phoneId = new Types.ObjectId(String(id));

        const response = await ServiceProvider.findOneAndUpdate(
            { phoneNo: phoneId },
            { $pull: { services: { _id: serviceId } } },
            { new: true },
        )
        if (!response) {
            return res.status(400).json({ success: false, message: 'Service not found' });
        }
        return res.status(200).json({ success: true, message: 'Service deleted successfully' });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}


// fetch sent msg from the user to the provider
// this is for when he will click on the user msg then i will fetch the user sent msg to the provider
export const fetchUserSentMsg = async (req: any, res: any) => {
    try {
        const { senderId } = req.query;
        const { id } = req.user;

        if (!senderId) {
            return res.status(400).json({ success: false, message: 'userId is required' });
        }

        const providerPhoneId = new Types.ObjectId(String(id));

        // $elemMatch is used to match the value in the array 
        // findOne accepts only one argument
        const provider: any = await ServiceProvider.aggregate([
            { $match: { phoneNo: providerPhoneId } },
            { $unwind: '$enquiry' },
            { $match: { 'enquiry.sender': new Types.ObjectId(String(senderId)) } },
            {
                $project: {
                    enquiry: {
                        sender: 1,
                        messages: { $sortArray: { input: '$enquiry.messages', sortBy: { timeStamp: -1 } } }
                    }
                }
            }
        ])

        // mongoose mei objectId mei convert krne kii jrurt nhii hoti like findOne, findOneAndUpdate, findOneAndDelete but in the aggregation mongoose don't do it mongodb process it so we have to manually convert it to ObjectID
        // MongoDB itself processes aggregation, not Mongoose, MongoDB expects the type to match exactly
        // Mongoose automatically converts the string to ObjectId behind the scenes.
        //  $unwind will split it into multiple documents, one for each item in that array.

        // $elemMatch in the filter narrows which documents you get, by checking if the array contains an element matching your condition.
        // 'enquiry.$' in the projection tells MongoDB to include only the first matched element from that array in the result. 


        return res.status(200).json({ success: true, data: provider });

        //No $ = when specifying what to match.

        // With $ = when extracting values to work with in aggregation.
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const fetchAllUserSentMsg = async (req: any, res: any) => {
    try {
        console.log("req.user", req.user);
        const { id, isEmployeeLogin } = req.user;

        if (!id) {
            return res.status(400).json({ success: false, message: 'unauthorized' });
        }

        const phoneId = new Types.ObjectId(String(id));
        let providerPic;
        const lookupStage = {
            $lookup: {
                from: 'bases',
                localField: 'sender',
                foreignField: '_id',
                as: 'senderInfo',
            },

        };
        const pipeline: any = [
            { $match: { phoneNo: phoneId } },
            {
                $project: {
                    enquiry: 1,
                }
            },
            { $unwind: '$enquiry' },
            {
                $project: {
                    _id: 0,
                    sender: '$enquiry.sender',
                    isByMe: '$enquiry.isByMe',
                    latestMessage: {
                        $arrayElemAt: [
                            {
                                $slice: [
                                    {
                                        $sortArray: {
                                            input: '$enquiry.messages',
                                            sortBy: { timeStamp: -1 },
                                        },
                                    },
                                    1,
                                ],
                            },
                            0,
                        ],
                    },
                    imageUrl: 1
                },
            },
        ];

        if (isEmployeeLogin) {
            const providerPicInfo: any = await ServiceProvider.aggregate([
                { $match: { phoneNo: phoneId } },
                { $unwind: '$imageUrl' },
                {
                    $project: {
                        profilePic: {
                            $ifNull: ['$imageUrl.PH', 'not provided']
                        }
                    }
                },
                { $limit: 1 }
            ]);
            providerPic = providerPicInfo[0]?.profilePic;



        } else {
            const userPicInfo: any = await User.aggregate([
                { $match: { phoneNo: phoneId } },
                {
                    $project: {
                        profilePic: {
                            $ifNull: ['$profilePic', 'not provided']
                        }
                    }
                },
                { $limit: 1 }
            ]);
            providerPic = userPicInfo[0]?.profilePic;
        }

        pipeline.push(
            lookupStage,
            {
                $unwind: '$senderInfo',
            },
            {
                $lookup: {
                    from: 'phonenumbers',
                    localField: 'senderInfo.phoneNo',
                    foreignField: '_id',
                    as: 'senderInfo.phoneNo'
                }
            },
            {
                $unwind: '$senderInfo.phoneNo'
            },
            {
                $project: {
                    senderInfo: {
                        _id: '$senderInfo._id',
                        name: '$senderInfo.name',
                        phoneNo: '$senderInfo.phoneNo.phoneNumber',
                        email: '$senderInfo.phoneNo.email',
                        address: '$senderInfo.address',
                        avgRating: {
                            $ifNull: ['$senderInfo.avgRating', 0]
                        },
                        workingHrs: { $ifNull: ['$senderInfo.workingHours', { "start": "10.00", "end": "23.00" }] },
                        profilePic: { $ifNull: ['$senderInfo.imageUrl.PH', 'not provided'] },
                        vistingTime: { $ifNull: ['$senderInfo.vistingTime', 'not provided'] },
                        completedTasks: {
                            $ifNull: ['$senderInfo.completedTasks', 0]
                        },
                        experience: { $ifNull: ['$senderInfo.experience', 0] },
                        servicePrice: { $ifNull: ['$sender.servicePrice', 0] },

                    },
                    latestMessage: 1,
                    isByMe: 1
                }
            },
            {
                $unwind: '$senderInfo'
            }
        )
        const response: any = await Base.aggregate(pipeline);
        console.log("response", response);
        //   $ifNull: Returns the first value if it's not null or missing, otherwise returns the second (fallback) value.

        //  '$senderInfo.profilePic': The field you want if it exists.

        // Number	Purpose	Result
        // 1 (in $slice)	Limit to the first 1 item from the sorted messages	[ latestMessage ]
        // 0 (in $arrayElemAt)	Get the first (and only) element from that array	latestMessage


        return res.status(200).json({ success: true, data: response, profileImage: providerPic });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}


// $expr allows you to use aggregation expressions inside a regular query (not just in pipelines).

// $eq is a comparison operator that checks if two values are equal.

// "$recentConnectedUser" references the field in the document.

// "new Types.ObjectId(id)" is the value you're comparing to. 

// $ne is a comparison operator that checks if two values are not equal.

type EnquiryType = 'phone' | 'email' | 'chat'

interface EnquiryRequestBody {
    providerId: string;
    type: EnquiryType
}

// interface CustomRequest extends Request means:
// You are creating your own version of Express’s Request object with additional typing — only for the places where you explicitly use CustomRequest.


interface CustomRequest extends Request<any, any, EnquiryRequestBody> {
    user: { id: string }
}


// Position	Purpose
// 1st	Params: from URL like /user/:id
// 2nd	ResBody: what you send back (not often used)
// 3rd	ReqBody: what comes in req.body ✅
// 4th	Query: from req.query like ?page=2
// that is for the understanding how this postion works in the request

const allowedTypes = ['whatsapp', 'phone', 'chat'];

export const sendRecentConnectionEnquiry = async (req: CustomRequest, res: any) => {
    try {
        const { type, providerId } = req.body;
        const { id, isEmployeeLogin }: any = req.user;

        if (!type || !providerId) {
            return res.status(400).json({ success: false, message: 'please provide type and providerId' });
        }

        if (type && !allowedTypes.includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid type' });
        }

        const phoneId = new Types.ObjectId(String(id));

        const userData: any = await Base.findOne({
            phoneNo: phoneId,
        })

        const existingOne: any = await ServiceProvider.aggregate([
            { $match: { _id: new Types.ObjectId(providerId) } },
            {
                $project: { // filter krte waqt no need for unwind
                    matchedData: { // ye name hai result ka kii kisme store hoga You're creating a new field called matchedUsers.
                        // This will contain the result of a $filter operation applied on the recentConnectedUser array
                        $filter: {
                            input: '$recentConnectedUser', // yee wo array hai jisme se filter krna hai
                            as: 'user', // this is the name of the variable that will be used to refer to each element in the input array
                            cond: { // using $and to combine multiple conditions
                                $and: [
                                    { $eq: ['$$user.userPhoneRef', phoneId] }, // this checks if the type of the user is equal to the type provided in the request
                                    { $gt: ['$$user.timeStamp', new Date(Date.now() - 40000)] } // this checks if the timeStamp of the user is greater than the current time minus 5 minutes
                                ]
                            }
                        }
                    }
                }
            }
        ])
        // new Date(Date.now() - 40000) .. MongoDB expects a Date object to compare with a date field (timeStamp).

        const tittle = 'Enquiry';
        const message = `You have a new enquiry`;
        const providerData: any = await Base.findOne({ _id: providerId }).lean();
        const deviceToken = providerData?.deviceToken || "";
        const sendToData = {
            userId: userData._id,
            userName: userData.name,
            providerId: providerData?._id,
            providerName: providerData?.name,
        }
        const data = JSON.stringify(sendToData);
        if (existingOne[0].matchedData.length == 0) {
            await ServiceProvider.findOneAndUpdate(
                { _id: providerId },
                {
                    $push: {
                        recentConnectedUser: {
                            type,
                            userPhoneRef: phoneId
                        }
                    }
                },
                { new: true },
            )
            await User.findOneAndUpdate(
                { phoneNo: phoneId },
                {
                    $push: {
                        recentConnectedUser: {
                            type,
                            userPhoneRef: providerId
                        }
                    }
                },
                { new: true }
            )

            const providerData: any = await ServiceProvider.findOne({ _id: providerId }).lean().select('_id phoneNo');
            const phoneIdOfLoggedInProvider = providerData?.phoneNo;
            console.log("phoneIdofLoggedInProvider", providerData);
            await ServiceProvider.findOneAndUpdate(
                { phoneNo: phoneId },
                {
                    $push: {
                        recentConnectedUser: {
                            type,
                            userPhoneRef: phoneIdOfLoggedInProvider,
                            isByMe: isEmployeeLogin ? true : false,
                        }
                    }
                },
                { new: true }
            )
            const pushPayload: PushPayload = {
                tittle,
                message: message,
                deviceToken,
                type: "new_inquiry",
                data,
            }

            console.log("senderId", userData._id, "providerId", providerId);
            await NotifyBell.create({
                providerId: providerId,
                tittle,
                message,
                senderId: userData._id,
                datetime: Date.now()
            }) 

            return res.status(200).json({ success: true, message: 'Successfully added into recent connection' });
        }

        return res.status(200).json({ success: true, message: 'Already added into recent connection few second ago' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const getRecentConnectedUser = async (req: any, res: any) => {
    try {
        const { id, isEmployeeLogin } = req.user;

        const phoneId = new Types.ObjectId(String(id));


        // provider mei toh userRef rhegii user kii phoneId kii kisne connect kiya hai and user recentconncetd mei userRef me rehgii provide ki _id kii hum kisse connect kr rhe hai
        const lookupStage = {
            $lookup: {
                from: 'bases', // that means konse collection mei se lookup krenge
                localField: 'recentConnectedUser.userPhoneRef', // that means recentConnectedUser ke konse field mei se lookup krenge
                foreignField: isEmployeeLogin ? 'phoneNo' : '_id', // that means bases ke konse field mei se lookup krenge
                as: 'sender' // this is name of the result
            },
        }

        const response = await Base.aggregate([
            { $match: { phoneNo: phoneId } },
            {
                $project: {
                    recentConnectedUser: 1,
                }
            },
            { $unwind: '$recentConnectedUser' },
            lookupStage,
            { $unwind: '$sender' },
            {
                $project: {
                    sender: 1,
                    recentConnectedUser: 1
                }
            },
            {
                $lookup: {
                    from: 'phonenumbers', // that means konse collection mei se lookup krenge
                    localField: 'sender.phoneNo', // that means recentConnectedUser ke konse field mei se lookup krenge
                    foreignField: '_id', // that means users ke konse field mei se lookup krenge
                    as: 'sender.phoneNo' // This embeds the result inside senderInfo.phoneNo field directly.
                }
            },
            { $unwind: '$sender.phoneNo' },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'sender.category',
                    foreignField: '_id',
                    as: 'sender.category'
                }
            },
            { $unwind: '$sender.category' },
            {
                $project: {
                    senderInfo: {
                        id: '$sender._id',
                        name: { $ifNull: ['$sender.name', 'not provided'] },
                        phoneNo: { $ifNull: ['$sender.phoneNo.phoneNumber', 'not provided'] },
                        profilePic: { $ifNull: ['$sender.imageUrl.PH', 'not provided'] },
                        email: { $ifNull: ['$sender.phoneNo.email', 'not provided'] },
                        address: { $ifNull: ['$sender.address', 'mohali'] },
                        workingHrs: { $ifNull: ['$sender.workingHours', { start: 'not provided', end: 'not provided' }] },
                        avgRating: { $ifNull: ['$sender.avgRating', 0] },
                        experience: { $ifNull: ['$sender.experience', 12] },
                        completedTasks: { $ifNull: ['$sender.completedTasks', 'not provided'] },
                        servicePrice: { $ifNull: ['$sender.servicePrice', 0] },
                        category: { $ifNull: ['$sender.category.category', 'not provided'] },
                        vistingTime: { $ifNull: ['$senderInfo.vistingTime', "10.00 Am"] }
                    },
                    recentConnectedUser: {
                        type: 1,
                        isByMe: 1,
                        timeStamp: 1
                    }
                }
            }
        ])

        if (!response) {
            return res.status(400).json({ success: false, message: 'Recent Connected User not found' });
        }
        return res.status(200).json({ success: true, data: response });
    } catch (error) {
        console.log("error", error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const insertOffer = async (req: any, res: any) => {
    try {
        const { data } = req.body;

        if (!data || data.length === 0) {
            return res.status(400).json({ success: false, message: 'data is required' });
        }

        console.log("data", data);

        const { insertPayload, notificationInfo } = data;


        const validData = insertPayload.filter((item: any) => item.imageUrl && item.price && item.validity)

        console.log("validData", validData);

        if (validData.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide valid data' });
        }

        if (notificationInfo.length > 1) {
            sendPushToAll("New Festive Offers 🎉", `Check out the latest ${notificationInfo.length} offers in our app.`, notificationInfo[0].imageUrl, "serviceProviders", "notifcation_offer")
        } else if (notificationInfo.length === 1) {
            sendPushToAll(notificationInfo[0].tittle, notificationInfo[0].message, notificationInfo[0].imageUrl, "serviceProviders", "notifcation_offer")
        }

        await NotifyBell.create({
            tittle : notificationInfo[0].tittle,
            message : notificationInfo[0].message,
            type : "new_offer",
        })
        const response = await Offer.insertMany(validData);

        if (!response) {
            return res.status(400).json({ success: false, message: 'Offer not added' });
        }


        return res.status(200).json({ success: true, message: 'Offer added successfully' });
    } catch (error) {
        console.log("error", error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const getAllOffer = async (req: any, res: any) => {
    try {
        const { id, role } = req.user;
        if (role === 'admin') {
            const data = await Offer.find();
            return res.status(200).json({ success: true, data });
        }

        const objId = new Types.ObjectId(String(id));

        const provider = await ServiceProvider.findOne({
            phoneNo: objId
        }
        ).select('_id').lean()

        if (!provider) {
            return res.status(400).json({ success: false, message: 'Provider not found' });
        }

        const order: any = await Order.findOne({
            providerId: provider._id,
            status: "paid",
            isActive: true
        }).sort({ startDate: -1 }).lean();

        const data = await Offer.find();

        if (!order) {
            return res.status(200).json({
                isActive: false,
                message: "No active subscription.",
                isExpired: false,
                data
            });
        }

        if (order.endDate < new Date()) {
            await Order.findOneAndUpdate({
                serviceProviderId: objId,
            },
                {
                    isActive: false,
                })

            await ServiceProvider.updateOne(
                { phoneNo: objId },
                { $unset: { orderId: 1 } }
            )

            await Order.deleteOne(
                { _id: order._id }
            )
            return res.status(200).json({
                message: "Your subscription has been expired.",
                isExpired: true,
                data
            })
        }

        if (!data) {
            return res.status(400).json({ success: false, message: 'Offer not found' });
        }

        const validity = order.endDate.getTime() - new Date().getTime();

        const validityInDays = Math.ceil(validity / (1000 * 60 * 60 * 24));

        return res.status(200).json({ success: true, data, offer: order, isExpired: false, validity: validityInDays });

    } catch (error) {
        console.log("error", error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const deleteOffer = async (req: any, res: any) => {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ success: false, message: 'Please provide valid id' });
        }

        const response = await Offer.findByIdAndDelete(id).lean();

        if (!response) {
            return res.status(400).json({ success: false, message: 'Offer is not deleted mor may be id provided id doesnt exist' });
        }

        return res.status(200).json({ success: true, message: 'Offer deleted successfully' });
    } catch (error) {
        console.log("error", error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
export const updateOffer = async (req: any, res: any) => {
    try {
        const { id } = req.query;
        const { data } = req.body;

        const response = await Offer.updateOne(
            { _id: id },
            { $set: data }
        );

        if (!response.modifiedCount) {
            return res.status(400).json({ success: false, message: 'Offer not updated' });
        }
        return res.status(200).json({ success: true, message: 'Offer updated successfully' });

    } catch (error) {
        console.log("error", error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const handleReview = async (req: any, res: any) => {
    try {
        const { rating, comment, providerId } = req.body;
        const { id, isEmployeeLogin } = req.user;
        if (rating > 5 || rating < 1) {
            return res.status(400).json({ success: false, message: 'Invalid rating' });
        }
        if (!rating || !providerId) {
            return res.status(400).json({ success: false, message: 'Review is required' });
        }

        const phoneId = new Types.ObjectId(String(id));
        const reviewUser: any = await Base.findOne({ phoneNo: phoneId }, { name: 1 }).lean();

        const userName = reviewUser?.name;
        const data: any = {
            sendedBy: phoneId,
            rating,
            comment,
            time: new Date(),
        }

        const providerIdObj = new Types.ObjectId(String(providerId));
        const existingComment = await ServiceProvider.findOne(
            { _id: providerIdObj, 'reviewComments.sendedBy': phoneId },
            {
                reviewComments: { $elemMatch: { sendedBy: phoneId } }
            }
        ).lean();

        if (existingComment) {
            return res.status(400).json({ success: false, message: 'You have already reviewed' });
        }

        const response = await ServiceProvider.updateOne(
            { _id: providerIdObj },
            { $push: { reviewComments: data } }
        );

        // ye reviewData mei iss liye chla raha huu kyukii jb koii user provider ko review dega toh review toh mei insert krwa raha hu but avgRating bhi toh provider kii change hogi then usse update krne ke liye mei ye merge kr raha mtlb kii user ne review diya or wo reviewComments mei add hogya then mei uspe $avg lga ke uski avg nikal raha hu then jo nayii avg aayi hai usse update kr sku avgRating mei...

        await ServiceProvider.aggregate([
            { $match: { _id: providerIdObj } },
            { $unwind: '$reviewComments' },
            {
                $group: {
                    _id: "$_id",
                    avgRating: { $avg: '$reviewComments.rating' },
                    completedTasks: { $sum: 1 },
                    totalReviews: { $sum: 1 }
                }
            },
            {
                $merge: {
                    into: 'bases',
                    on: '_id',
                    whenMatched: 'merge',
                    whenNotMatched: 'discard'
                }
            }
        ])

        const provider: any = await ServiceProvider.findOne({ _id: providerIdObj }, { deviceToken: 1 }).lean();

        if (!response) {
            return res.status(400).json({ success: false, message: 'Review is not added' });
        }
        const pushPayload: PushPayload = {
            tittle: 'New Review',
            message: `You have new review from ${userName}`,
            deviceToken: provider?.deviceToken,
            type: 'notification',
        }

        sendPush(pushPayload)
        return res.status(200).json({ success: true, message: 'Review added successfully' });

    } catch (error) {
        console.log("error", error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const getAllReview = async (req: any, res: any) => {
    try {
        const { id } = req.user;
        const phoneId = new Types.ObjectId(String(id));
        console.log("phoneId", phoneId)
        const response = await ServiceProvider.aggregate([
            { $match: { phoneNo: phoneId } },
            {
                $project: {
                    reviewComments: 1
                }
            },
            { $unwind: '$reviewComments' },
            {
                $lookup: {
                    from: 'bases', // that means konse collection mei se lookup krenge
                    localField: 'reviewComments.sendedBy', // that means recentConnectedUser ke konse field mei se lookup krenge
                    foreignField: 'phoneNo', // that means users ke konse field mei se lookup krenge
                    as: 'reviewComments.sendedBy' // This embeds the result inside senderInfo.phoneNo field directly.
                }
            },
            { $unwind: '$reviewComments.sendedBy' },
            {
                $project: {
                    rating: '$reviewComments.rating',
                    name: '$reviewComments.sendedBy.name',
                    timeStamp: { $ifNull: ['$reviewComments.time', '$$NOW'] },
                    message: { $ifNull: ['$reviewComments.message', ''] },
                    comment: { $ifNull: ['$reviewComments.comment', ''] },
                    senderId: '$reviewComments.sendedBy.phoneNo',
                }
            },
            {
                $sort: { timeStamp: -1 }
            },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' },
                    reviews: { $push: '$$ROOT' },
                }
            }
        ])
        if (!response) {
            return res.status(400).json({ success: false, message: 'Review not found' });
        }
        return res.status(200).json({ success: true, data: response });
    } catch (error) {
        console.log("error", error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const sendReviewMsgToUser = async (req: any, res: any) => {
    try {
        const { id } = req.user;
        const { reviewId, message } = req.body;

        if (!reviewId || !message) {
            return res.status(400).json({ success: false, message: 'Message is missing or reviewId is missing' });
        }

        const phoneId = new Types.ObjectId(String(id));

        const response = await ServiceProvider.updateOne(
            {
                phoneNo: phoneId, reviewComments: {
                    $elemMatch: {
                        sendedBy: reviewId,
                        $or: [
                            { message: { $in: [null, ''] } },
                            { message: { $exists: false } }
                        ]
                    }
                }
            },
            {
                $set: {
                    'reviewComments.$.message': message
                }
            }
        );

        if (!response.modifiedCount) {
            return res.status(400).json({ success: false, message: 'Message not sent' });
        }
        return res.status(200).json({ success: true, message: 'Message sent successfully' });

    } catch (error) {
        console.log("error", error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const userToProvider = async (req: any, res: any) => {
    try {
        const { id } = req.user;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Unauthorized' });
        }

        const phoneId = new Types.ObjectId(String(id));

        const response = await User.aggregate([
            { $match: { phoneNo: phoneId } },
            // {$lookup : {
            //     from: 'phonenumbers',
            //     localField: 'phoneNo',
            //     foreignField: '_id',
            //     as: 'userInfo'
            // }},
            // {$unwind : '$userInfo'},
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    phoneNo: 1,
                    address: 1,
                    deviceToken: 1,
                }
            }
        ]);

        if (!response || response.length === 0) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        const deleteUser = await User.findOneAndDelete({ phoneNo: phoneId });

        if (!deleteUser) {
            return res.status(400).json({ success: false, message: 'User is not deleted' });
        }

        const providerCreated = await ServiceProvider.create(response[0]);

        return res.status(200).json({ success: true, message: 'User role updated to serviceProvider', data: providerCreated });

    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const sendNotificationToAll = async (req: any, res: any) => {
    try {

        console.log("req.user", req.body);
        const { data } = req.body;

        console.log("notify", data);
        if (!data) {
            return res.status(400).json({ success: false, message: 'Notification data is missing' });
        }
        const { tittle, message } = data;

        if (!tittle || !message) {
            return res.status(400).json({ success: false, message: 'Tittle or message is missing' });
        }

        sendPushToAll(tittle, message, "", "allUsers")

        const response = await NotifyBell.create({
            tittle,
            message,
            datetime: new Date(),
            type: "allUsers"
        })

        console.log("response", response)

        return res.status(200).json({ success: true, message: 'Notification sent successfully' });

    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const getAllNotification = async (req: any, res: any) => {
    try {
        const response = await Notify.find().sort({ datetime: -1 });

        return res.status(200).json({ success: true, data: response });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}


export const providerUserCount = async (req: any, res: any) => {
    try {
        // const { id } = req.user;
        // if (!id) {
        //     return res.status(400).json({ success: false, message: 'Unauthorized' });
        // }

        const [baseCounts, offerCount, notifyCount] = await Promise.all([
            Base.aggregate([
                { $group: { _id: "$role", total: { $sum: 1 } } }
            ]),
            Offer.aggregate([
                { $group: { _id: null, total: { $sum: 1 } } }
            ]),
            Notify.aggregate([
                { $group: { _id: null, total: { $sum: 1 } } }
            ])
        ])

        const response = {
            baseCounts,
            offerCount,
            notifyCount
        }
        return res.status(200).json({ success: true, data: response });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const getAllUser = async (req: any, res: any) => {
    try {
        const response = await User.aggregate([
            {
                $lookup:
                {
                    from: 'phonenumbers',
                    localField: 'phoneNo',
                    foreignField: '_id',
                    as: 'phoneNo'
                }
            },
            { $unwind: '$phoneNo' },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    phoneNo: '$phoneNo.phoneNumber',
                    email: '$phoneNo.email',
                    address: 1,
                    pinCode: { $ifNull: ['$phoneNo.pinCode', '311342'] },
                }
            }
        ])
        return res.status(200).json({ success: true, data: response });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}