import express from "express";
import { getOtp, registerProvider, registerUser, verifyOtp, upload, handleImage, handleImageUrl, getProviderList, updateStatusProvider, addProvider, uploadMultiple, updateProviderStatus, storePhone, addCategory, seeAllCategory, deleteCategory, getProviderInfo, getProviderWithCategory, updateProviderProfile, updateUserInfo} from "../controllers/userController";
import verifyToken from "../middlewares/auth";

const router = express.Router();

router.post("/get-otp", getOtp); 
router.post("/verify-otp", verifyOtp);
router.post("/register-user", registerUser)
router.post("/register-provider", registerProvider)
router.post('/upload-image', upload.single('image'), handleImage);
router.post('/store-image-link', handleImageUrl);
router.get('/get-provider-list', getProviderList)
router.post('/update-status', updateStatusProvider)
router.post('/phone-by-admin', storePhone)
router.post('/add-provider', (req : any, res : any, next : any) => {
    console.log("Content-Type:", req.headers['content-type']);
    next();
}, uploadMultiple, addProvider);
router.put('/update-provider-status/:id', updateProviderStatus)
router.post('/categories', addCategory)
router.get('/get-all-category', seeAllCategory)
router.get('/get-category', verifyToken, seeAllCategory)
router.delete('/delete-category/:id', deleteCategory)
router.get('/provider-with-subcat/:page/:limit/:subcat',verifyToken, getProviderWithCategory)
router.get('/get-provider-info/:id', verifyToken, getProviderInfo)
router.put('/update-provider-info', updateProviderProfile)
router.put('/update-user-info', updateUserInfo)
export default router;