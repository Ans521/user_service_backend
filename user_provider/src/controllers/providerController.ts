import { ServiceProvider } from "../models/serviceProvider";
import { Types } from "mongoose";
import { SubCategory } from "../models/subCategory";
import { Category } from "../models/categorySchema";
import { Banner } from "../models/banner";
import { Request } from "express";
import { Offer } from "../models/offer";
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

        if (!data || data.length === 0) {
            return res.status(400).json({ success: false, message: 'data is required' });
        }

        const result = await Banner.insertMany(data);

        return res.status(200).json({ success: true, message: 'Banner added successfully', data: result });
    } catch {
        return res.status(200).json({ success: false, message: 'Banner not Added' });
    }
}

export const getAllBanner = async (req: any, res: any) => {
    try {
        const { position } = req.query;
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

        if (position === 'all') {

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
        const { id } = req.user;

        if (!id) {
            return res.status(400).json({ success: false, message: 'unauthorized' });
        }

        const phoneId = new Types.ObjectId(String(id));
        const providerPicInfo : any = await ServiceProvider.aggregate([
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

        const providerPic = providerPicInfo[0]?.profilePic

        const response = await ServiceProvider.aggregate([
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
            {
                $lookup: {
                    from: 'bases',
                    localField: 'sender',
                    foreignField: 'phoneNo',
                    as: 'senderInfo',
                },
            },
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
                        profilePic: {
                            $ifNull: ['$senderInfo.profilePic', 'not provided']
                        }
                    },
                    latestMessage: 1,
                }
            },
            {
                $unwind: '$senderInfo'
            }
        ]);

        //   $ifNull: Returns the first value if it's not null or missing, otherwise returns the second (fallback) value.

        //  '$senderInfo.profilePic': The field you want if it exists.

        return res.status(200).json({ success: true, data: response, providerPic });
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
        type : EnquiryType
    }

    // interface CustomRequest extends Request means:
    // You are creating your own version of Express’s Request object with additional typing — only for the places where you explicitly use CustomRequest.


    interface CustomRequest extends Request<any, any, EnquiryRequestBody> {
        user : {id : string}
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
        const{ type, providerId } = req.body;
        const { id } = req.user;

        if(!type || !providerId) {
            return res.status(400).json({ success: false, message: 'please provide type and providerId' });
        }

        // .includes return boolean value -->  true or false
        if(type && !allowedTypes.includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid type' });
        }
        const phoneId = new Types.ObjectId(String(id));

        const existingOne : any = await ServiceProvider.findOne({
            _id : providerId,
            recentConnectedUser : {
                $elemMatch : {
                    userPhoneRef : phoneId,
                    timeStamp : { $gt : new Date(Date.now() - 40000) } // new Date(...) → converts that timestamp back into a Date object.
                }
            }
        });

        if (!existingOne) {
            await ServiceProvider.findOneAndUpdate(
                { _id : providerId },
                { $push: { 
                    recentConnectedUser: { 
                        type, 
                        userPhoneRef : phoneId
                }}},
                { new : true },
            )
            return res.status(200).json({ success: true, message: 'Successfully added into recent connection'});
        }

        return res.status(200).json({ success: true, message: 'Already added into recent connection few second ago'});
        
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const getRecentConnectedUser = async (req : any,  res : any) => {
    try {
        const { id } = req.user;

        const phoneId = new Types.ObjectId(String(id));

        const response = await ServiceProvider.aggregate([
            {$match : {phoneNo : phoneId}},
            {$project : {
                recentConnectedUser : 1
            }},
            {$unwind : '$recentConnectedUser'},
            {$lookup : {
                from : 'bases', // that means konse collection mei se lookup krenge
                localField : 'recentConnectedUser.userPhoneRef', // that means recentConnectedUser ke konse field mei se lookup krenge
                foreignField : 'phoneNo', // that means bases ke konse field mei se lookup krenge
                as : 'senderInfo' // this is name of the result
            }},
            {$unwind : '$senderInfo'},
            {$project : {
                senderInfo : 1,
                recentConnectedUser : 1
            }},
            {$lookup : {
                from : 'phonenumbers', // that means konse collection mei se lookup krenge
                localField : 'senderInfo.phoneNo', // that means recentConnectedUser ke konse field mei se lookup krenge
                foreignField : '_id', // that means users ke konse field mei se lookup krenge
                as : 'senderInfo.phoneNo' // This embeds the result inside senderInfo.phoneNo field directly.
            }},
            {$unwind : '$senderInfo.phoneNo'},
            {$project : {
                userInfo : {
                    id : '$senderInfo._id',
                    name : {$ifNull : ['$senderInfo.name', 'not provided']},
                    phoneNo : {$ifNull : ['$senderInfo.phoneNo.phoneNumber', 'not provided']},
                    profilePic : {$ifNull : ['$senderInfo.profilePic', 'not provided']},
                    email : {$ifNull : ['$senderInfo.phoneNo.email', 'not provided']},
                    address :{$ifNull : ['$senderInfo.address', 'not provided' ] }
                },
                recentConnectedUser : {
                    type : 1,
                    timeStamp : 1
                }
            }}  
        ]) 

        console.log("response", response.length)

        if (!response) {
            return res.status(400).json({ success: false, message: 'Recent Connected User not found' });
        }
        return res.status(200).json({ success: true, data: response });
    } catch (error) {
        console.log("error", error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const insertOffer = async (req : any,  res : any) => {
    try {
        const { data } = req.body;
        console.log("reqObj", data);

        const validData = data.filter((item : any) => item.imageUrl && item.price && item.validity)

        if(validData.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide valid data' });
        }
        const response = await Offer.insertMany(validData);
        
        if(!response){
            return res.status(400).json({ success: false, message: 'Offer not added' });
        }
        return res.status(200).json({ success: true, message: 'Offer added successfully' });
    } catch (error) {
        console.log("error", error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const getAllOffer = async (req : any,  res : any) => {
    try {
        const data = await Offer.find();
        if(!data){
            return res.status(400).json({ success: false, message: 'Offer not found' });
        }
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.log("error", error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const deleteOffer = async (req : any,  res : any) => {
    try{
        const {id} = req.query;

        if(!id){
            return res.status(400).json({ success: false, message: 'Please provide valid id' });
        }
        
        const response = await Offer.findByIdAndDelete(id).lean();

        if(!response){
            return res.status(400).json({ success: false, message: 'Offer is not deleted mor may be id provided id doesnt exist' });
        }

        return res.status(200).json({ success: true, message: 'Offer deleted successfully' });
    }catch(error){
        console.log("error", error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
export const updateOffer = async (req : any,  res : any) => {
    try {
        const { id } = req.query;
        const { data } = req.body;
        
        const response = await Offer.updateOne(
            { _id : id },
            { $set : data }
        );

        if(!response.modifiedCount){
            return res.status(400).json({ success: false, message: 'Offer not updated' });
        }
        
        return res.status(200).json({ success: true, message: 'Offer updated successfully' });
        
    } catch (error) {
        console.log("error", error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const handleReview = async (req : any,  res : any) => {
    try {
        const { rating, comment, providerId } = req.body;
        const { id } = req.user;
        if(rating > 5 || rating < 1){
            return res.status(400).json({ success: false, message: 'Invalid rating' });
        }
        if(!rating || !providerId){
            return res.status(400).json({ success: false, message: 'Review is required' });
        }

        const phoneId = new Types.ObjectId(String(id));

        const data : any = {
            sendedBy : phoneId,
            rating,
            comment
        }
        console.log("phoneId", phoneId)
        const existingComment = await ServiceProvider.findOne(
            {_id : providerId, 'reviewComments.sendedBy' : phoneId},
            {reviewComments : {$elemMatch : {sendedBy : phoneId}}}
        ).lean();

        if(existingComment){
            return res.status(400).json({ success: false, message: 'You have already reviewed' });
        }

        const response = await ServiceProvider.updateOne(
            { _id : providerId },
            { $push : { reviewComments : data } }
        );
        if(!response){
            return res.status(400).json({ success: false, message: 'Review not added' });
        }
        return res.status(200).json({ success: true, message: 'Review added successfully' });
    } catch (error) {
        console.log("error", error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const getAllReview = async (req : any,  res : any) => {
    try {
        const { id } = req.user;
        const phoneId = new Types.ObjectId(String(id));
        const response = await ServiceProvider.aggregate([
            { $match : { phoneNo : phoneId } },
            {$project : {
                reviewComments : 1
            }},
            {$unwind : '$reviewComments'},
            {$lookup : {
                from : 'bases', // that means konse collection mei se lookup krenge
                localField : 'reviewComments.sendedBy', // that means recentConnectedUser ke konse field mei se lookup krenge
                foreignField : 'phoneNo', // that means users ke konse field mei se lookup krenge
                as : 'reviewComments.sendedBy' // This embeds the result inside senderInfo.phoneNo field directly.
            }},
            {$unwind : '$reviewComments.sendedBy'},
            {$project : {
                rating : '$reviewComments.rating',
                name : '$reviewComments.sendedBy.name',
                message : {$ifNull : ['$reviewComments.message', '']},
                comment : {$ifNull : ['$reviewComments.comment', '']},
                senderId : '$reviewComments.sendedBy.phoneNo',
            }},
            {
                $group : {
                    _id : null,
                    avgRating : {$avg : '$rating'},
                    reviews : {$push : '$$ROOT'}
                }
            }
        ])
        if(!response){
            return res.status(400).json({ success: false, message: 'Review not found' });
        }
        return res.status(200).json({ success: true, data : response });
    } catch (error) {
        console.log("error", error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const sendReviewMsgToUser = async (req : any,  res : any) => {
    try{
        const { id } = req.user;
        const {reviewId, message} = req.body;
        
        if(!reviewId || !message){
            return res.status(400).json({ success: false, message: 'Message is missing or reviewId is missing' });
        }

        const phoneId = new Types.ObjectId(String(id));
        
        const response = await ServiceProvider.updateOne(
            { phoneNo : phoneId, reviewComments : {
                $elemMatch : {
                    sendedBy : reviewId, 
                    $or : [
                        {message : {$in : [null, ''] } },
                        {message : {$exists : false} }
                    ]
                }
            }},
            {
                $set : {
                    'reviewComments.$.message' : message
                }
            }
        );
        
        if(!response.modifiedCount){
            return res.status(400).json({ success: false, message: 'Message not sent' });
        }
        return res.status(200).json({ success: true, message: 'Message sent successfully' });
        
    }catch(error){
        console.log("error", error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
