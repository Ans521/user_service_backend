import { ServiceProvider } from "../models/serviceProvider";
import { Types } from "mongoose";

export const uploadImages = async (req : any,  res : any) => {
    try {
        const { id, isEmployeeLogin }  = req.user;

        if(!isEmployeeLogin || !id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const imageUrlObj = req.files;

        if (!imageUrlObj) {
            return res.status(400).json({ success: false, message: 'uploadImageUrl is required' });
        }
        const imageUrls = imageUrlObj.map((file : any) =>  `http://localhost:4000/uploads/${file.filename}`);

        if (imageUrls.length === 0) {
            return res.status(400).json({ success: false, message: 'No images uploaded' });
        }

        const  phoneNoId = new Types.ObjectId(String(id));
        const galleryImagesCheck : any = await ServiceProvider.findOne({phoneNo : phoneNoId}).select('galleryImages');

        if(galleryImagesCheck?.galleryImages?.length >= 6) {
            return res.status(400).json({ success: false, message: 'You can only upload 6 images' });
        }

        const providerImages : any = await ServiceProvider.findOneAndUpdate(
            {phoneNo : phoneNoId},
            {$push : { galleryImages: {$each : imageUrls} }},
            { new: true}
        )

        return res.status(200).json({ success: true, message : 'Images uploaded successfully', data: providerImages?.galleryImages });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};