import express from "express";
import { getOtp, registerProvider, registerUser, verifyOtp, handleImageUrl, getProviderList, addProvider, uploadMultiple, updateProviderStatus, storePhone, addCategory, seeAllCategory, deleteCategory, getProviderInfo, getProviderWithCategory, updateProfile, searchProvider, userSentMsg, recentProviderEnquiry, getInfoUserProvider} from "../controllers/userController";
import verifyToken from "../middlewares/auth";

const router = express.Router();

router.post("/get-otp", getOtp); 
router.post("/verify-otp", verifyOtp);
router.post("/register-user", registerUser);
router.post("/register-provider", registerProvider);

router.post('/upload-image', (req : any, res : any, next : any) => {
    console.log("Content-Type:", req.headers['content-type']);
    next();
}, uploadMultiple, addProvider);

router.post('/upload-document',uploadMultiple, handleImageUrl);
router.get('/get-provider-list', getProviderList)
router.post('/phone-by-admin', storePhone)
router.put('/update-provider-status/:id', updateProviderStatus)
router.post('/categories', addCategory)
router.get('/get-all-category',verifyToken, seeAllCategory)
router.delete('/delete-category/:id', deleteCategory)
router.post('/provider-with-filter', getProviderWithCategory)
router.get('/get-provider-info', verifyToken, getProviderInfo)
router.put('/update-info', verifyToken, updateProfile)
router.get('/get-info',verifyToken, getInfoUserProvider)
// router.get('/search-provider', searchProvider)
router.post('/send-msg-to-provider', verifyToken, userSentMsg)
router.get('/recent-enquiry', verifyToken, recentProviderEnquiry)

export default router;