import { ServiceProvider } from "../models/serviceProvider";
import { Types } from "mongoose";
import { SubCategory } from "../models/subCategory";
 
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
        const imageUrls = imageUrlObj.map((file : any) =>  `http://13.202.163.238:4000/uploads/${file.filename}`);
 
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
            console.log("req.body", req.body)

            const {category, categoryId, subcategoryId ,subcategories} = req.body;
            const categoryIds = new Types.ObjectId(categoryId as string);
            
            await category.findOneAndUpdate(
                {category : categoryIds},
                {category},
                { new: true, upsert: true }, 
            )
            
            // Promise.all() is used here to wait for all the async operations (findOneAndUpdate or create) inside .map() to finish before moving on.
            // Without Promise.all(), the function won’t wait for all awaits in the .map() loop — it might finish early and cause unexpected results or incomplete DB writes.
            await Promise.all(subcategories.map(async (item : any) => {
                if(item.subcategoryId){
                    const subcategoryIds = new Types.ObjectId(item.subcategoryId as string);
                    await SubCategory.findOneAndUpdate(
                        {subcategory : subcategoryIds},
                        {name : item.name, iconImage : item.iconImage, category : categoryIds},
                        { new: true, upsert: true }, 
                    )
                }else{
                    await SubCategory.create({name : item.name, iconImage : item.iconImage, category : categoryIds})
                }
            }))
            return res.status(200).json({ success: true, message : 'Category updated successfully' });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
}