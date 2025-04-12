import express from "express";
import { getOtp, registerProvider, registerUser, verifyOtp, upload, handleImage, handleImageUrl, getProviderList, updateStatusProvider, addProvider, uploadMultiple, updateProviderStatus, storePhone} from "../controllers/userController";

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

export default router;