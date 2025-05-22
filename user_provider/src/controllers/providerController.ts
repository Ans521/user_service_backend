import { ServiceProvider } from "../models/serviceProvider";
import { Types } from "mongoose";
import { SubCategory } from "../models/subCategory";
import { Category } from "../models/categorySchema";
import { Banner } from "../models/banner";
 
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
        const imageUrls = imageUrlObj.map((file : any) =>  `http://82.180.144.143:4000/uploads/${file.filename}`);
 
        if (imageUrls.length === 0) {
            return res.status(400).json({ success: false, message: 'No images uploaded' });
        }
 
        const  phoneNoId = new Types.ObjectId(String(id));
        const galleryImagesCheck : any = await ServiceProvider.findOne({phoneNo : phoneNoId}).select('galleryImages');
 
        // if(galleryImagesCheck?.galleryImages?.length >= 6) {
        //     return res.status(400).json({ success: false, message: 'You can only upload 6 images' });
        // }
 
        const providerImages : any = await ServiceProvider.findOneAndUpdate(
            {phoneNo : phoneNoId},
            {$push : { galleryImages: {$each : imageUrls} }},
            { new: true}
        )
 
        return res.status(200).json({ success: true, message : 'Images uploaded successfully', data: providerImages });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const addSpecialCategory = async (req : any, res : any) => {
    try{
        console.log("req.body", req.body)
        const { data } = req.body;
        if(!data || data.length === 0) {
            return res.status(400).json({ success: false, message: 'data is required' });
        }
        const operations = data.map((item : any) => {
            return {
                updateOne : {
                    filter : {_id : item.subcategoryId},
                    update : {
                        $set : {
                            iconImage : item.iconImage,
                            specialCategory : true
                        }
                    }
                }
            }
        })
 
        const result : any = await SubCategory.bulkWrite(operations);
        console.log("result", result);
        return res.status(200).json({ success: true, message : 'subcat added successfully' });
    }catch(error){
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
 
export const getAddedSpecialCateogory = async (req : any, res : any) => {
    try{
        const data = await SubCategory.find({specialCategory : true}).select('-__v');
        if(!data || data.length === 0) {
            return res.status(400).json({ success: false, message: 'No data found' });
        }
        return res.status(200).json({ success: true, data });
    }catch(error){
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
 
export const updateCategory = async (req : any, res : any) => {
        try {
            const {category, categoryId, subcategories} = req.body;
            const categoryIds = new Types.ObjectId(categoryId as string);
            console.log("categoryIds", categoryIds);
          
            const response = await Category.findOneAndUpdate(
                {_id : categoryId},
                {category},
                { new: true}, 
            )
            console.log("response", response);
            if(!response) {
                return res.status(400).json({ success: false, message: 'Category not found' });
            }
            // Promise.all() is used here to wait for all the async operations (findOneAndUpdate or create) inside .map() to finish before moving on.
            // Without Promise.all(), the function won’t wait for all awaits in the .map() loop — it might finish early and cause unexpected results or incomplete DB writes.
            await Promise.all(subcategories.map(async (item : any) => {
                if(item.subcategoryId){
                    const subcategoryIds = new Types.ObjectId(item.subcategoryId as string);
                    console.log("subcategoryIds", subcategoryIds);
                    await SubCategory.findOneAndUpdate(
                        {_id : subcategoryIds},
                        {name : item.name, image : item.image, category : categoryIds},
                        { new: true, upsert: true }, 
                    )
                }else{
                    await SubCategory.create({name : item.name, image : item.image, category : categoryIds})
                }
            }))
            return res.status(200).json({ success: true, message : 'Category updated successfully' });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
}

export const removeSpecialCategory = async (req : any, res : any) => {
    try {
        console.log("req.body", req.body)
        const { subcategoryId, specialCategory } = req.body;

        const response = await SubCategory.findOneAndUpdate(
            {_id : subcategoryId},
            {specialCategory : specialCategory},
            { new: true}, 
        )
        if(!response) {
            return res.status(400).json({ success: false, message: 'Subcategory not found' });
        }
        return res.status(200).json({ success: true, message : 'Subcategory updated successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}


export const getAllBanner = async (req: any, res: any) => {
    try {
        // const banners = await Banner.find(); // fetch all documents
        const banner = [
            'http://82.180.144.143:4000/uploads/1747325647642.png',
            'http://82.180.144.143:4000/uploads/1747322414998.png',
            'http://82.180.144.143:4000/uploads/1747322470194.png'
        ]
        return res.status(200).json({ success: true, data: banner });
    } catch (error) {
        console.error("Error fetching banners:", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
 
export const setServiceList = async (req : any, res : any) => {
    try {
        const { service, serviceList } = req.body;
        if(!serviceList || !service || serviceList.length === 0) {
            return res.status(400).json({ success: false, message: 'serviceList is required' });
        }
        const { id } = req.user;
        if(!id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const services = {
            service,
            serviceList
        }
        const phoneNoId = new Types.ObjectId(String(id));
        const response = await ServiceProvider.findOneAndUpdate(
            {phoneNo : phoneNoId},
            {$push : {services}},
            { new: true, upsert: false}, 
        )
        if(!response) {
            return res.status(400).json({ success: false, message: 'Service provider not found' });
        }
        return res.status(200).json({ success: true, message : 'Service list updated successfully' });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const getServiceList = async (req : any, res : any) => {
    try {
        let providerId = "";
        if(req.query.id) {
            const { id } = req.query;
            providerId = id;
            console.log("in the query", providerId);
            const response = await ServiceProvider.findOne(
                {_id: providerId},
                {services : 1},
            )
            console.log("response", response);
            if(!response) {
                return res.status(400).json({ success: false, message: 'Service List is not found' });
            }
            return res.status(200).json({ success: true, data : response });
        }else if(req.user && req.user.id) {
            const id = req.user.id;
            providerId = id; 
            console.log("in the user", providerId);
            const phoneNoId = new Types.ObjectId(String(providerId));
            const response = await ServiceProvider.findOne(
                {phoneNo : phoneNoId},
                {services : 1},
            )
            if(!response) {
                return res.status(400).json({ success: false, message: 'Service List is not found' });
            }
            return res.status(200).json({ success: true, data : response });
        }else{
            return res.status(400).json({ success: false, message: 'id is required' });
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const deleteService = async (req : any, res : any) => {
    try {
        const { serviceId } = req.query;
        console.log("serviceId", serviceId);
        
        const {id} = req.user
        if(!id) {
            return res.status(400).json({ success: false, message: 'unauthorized' });
        }
        const phoneId = new Types.ObjectId(String(id));
        const response = await ServiceProvider.findOneAndUpdate(
            {phoneNo : phoneId},
            {$pull : {services : {_id : serviceId} }},
            { new: true}, 
        )
        if(!response) {
            return res.status(400).json({ success: false, message: 'Service not found' });
        }
        return res.status(200).json({ success: true, message : 'Service deleted successfully' });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}