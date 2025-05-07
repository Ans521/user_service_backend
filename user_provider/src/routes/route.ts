import express from "express";
import { getOtp, registerProvider, upload, registerUser, verifyOtp, handleSingleImageUrl, getProviderList, addProvider, uploadMultiple, updateProviderStatus, storePhone, addCategory, seeAllCategory, deleteCategory, getProviderInfo, getProviderWithCategory, updateProfile, userSentMsg, recentProviderEnquiry, getInfoUserProvider, handleImageUrls} from "../controllers/userController";
import verifyToken from "../middlewares/auth";
import { uploadImages } from "../controllers/providerController";

const router = express.Router();

router.post("/get-otp", getOtp); 
router.post("/verify-otp", verifyOtp);
router.post("/register-user", registerUser);
router.post("/register-provider", registerProvider);

router.post('/resgister-admin-provider', uploadMultiple, addProvider);
router.post('/upload-image', upload.single('image'), handleSingleImageUrl);
router.post('/upload-gallery', verifyToken, upload.array('images', 6), uploadImages) // gallery wali image upload

router.post('/upload-document', handleImageUrls);
router.get('/get-provider-info',verifyToken, getProviderInfo)
router.get('/get-provider-list', getProviderList) // admin api
router.post('/phone-by-admin', storePhone) // admin api
router.put('/update-provider-status/:id', updateProviderStatus)
router.post('/categories', addCategory) // admin api
router.get('/get-all-category', seeAllCategory)
router.delete('/delete-category/:id', deleteCategory) // admin api
router.post('/provider-with-filter', verifyToken, getProviderWithCategory)
router.put('/update-info', verifyToken, updateProfile)
router.get('/get-info',verifyToken, getInfoUserProvider)
router.post('/send-msg-to-provider', verifyToken, userSentMsg)
router.get('/recent-enquiry', verifyToken, recentProviderEnquiry)

export default router;