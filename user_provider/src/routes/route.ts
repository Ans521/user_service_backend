import express, { Request, Response } from "express";
import { getOtp, registerProvider, registerUser, verifyOtp } from "../controllers/userController";

const router = express.Router();

router.post("/get-otp", getOtp); 
router.post("/verify-otp", verifyOtp);
router.post("/register-user", registerUser)
router.post("/register-provider", registerProvider)
export default router;