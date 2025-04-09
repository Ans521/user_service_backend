import express, { Request, Response } from "express";
import { getOtp, registerProvider, registerUser, verifyOtp, upload, handleImage, handleImageUrl, getProviderList, updateStatusProvider, addProvider} from "../controllers/userController";

const router = express.Router();

router.post("/get-otp", getOtp); 
router.post("/verify-otp", verifyOtp);
router.post("/register-user", registerUser)
router.post("/register-provider", registerProvider)
router.post('/upload-image', upload.single('image'), handleImage);
router.post('/store-image-link', handleImageUrl);
router.get('/get-provider-list', getProviderList)
router.post('/update-status', updateStatusProvider)
router.post('/add-provider', addProvider);
export default router;