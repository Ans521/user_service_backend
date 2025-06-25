import express from "express";
import { getOtp, registerProvider, upload, registerUser, verifyOtp, handleSingleImageUrl, getProviderList, addProvider, uploadMultiple, updateProviderStatus, storePhone, addCategory, seeAllCategory, deleteCategory, getProviderInfo, getProviderWithCategory, updateProfile, userSentMsg, getInfoUserProvider, handleImageUrls} from "../controllers/userController";
import verifyToken from "../middlewares/auth";
import { addSpecialCategory, getAddedSpecialCateogory, updateCategory, uploadImages, removeSpecialCategory, getAllBanner, setServiceList, getServiceList, deleteService, addBanner, deleteBanner, updateBanner, fetchUserSentMsg, fetchAllUserSentMsg} from "../controllers/providerController";

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

router.put('/update-icon-special-subcat', removeSpecialCategory) // admin api
router.post('/update-category', updateCategory) // admin api
router.post('/add-special-subcat', addSpecialCategory) // admin api
router.get('/get-special-subcat', getAddedSpecialCateogory) // admin api
router.get('/get-all-banner', getAllBanner) // admin and dashboard panel

router.post('/service-list', verifyToken, setServiceList);
router.get('/get-service-list', verifyToken, getServiceList);
router.delete('/delete-service', verifyToken, deleteService);
router.get('/fetch-sent-msg', verifyToken, fetchUserSentMsg);
router.post('/add-banner', addBanner); // admin api
router.delete('/delete-banner', deleteBanner); // admin api
router.put('/update-banner', updateBanner); // admin api
router.get('/fetch-all-sent-msg', verifyToken, fetchAllUserSentMsg);
// router.post('/recent-enquiry-sent', verifyToken, );
export default router;