import { ServiceProvider } from "../models/serviceProvider";
import { Types } from "mongoose";

export const uploadImages = async (req : any,  res : any) => {
    try {
        const { id, isEmployeeLogin }  = req.user;

        if(!isEmployeeLogin || !id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { imageUrl } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ success: false, message: 'uploadImageUrl is required' });
        }
        
        const  phoneNoId = new Types.ObjectId(String(id));

        const providerImages = await ServiceProvider.findOneAndUpdate(
            {phoneNo : phoneNoId},
            {$push : { galleryImages: imageUrl }},
            {new : true}
        )
        return res.status(200).json({ success: true, data : providerImages });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};