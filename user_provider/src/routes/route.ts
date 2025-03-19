import express, { Request, Response } from "express";
import { getOtp, verifyOtp } from "../controllers/userController";

const router = express.Router();

router.post("/get-otp", getOtp); 
router.post("/verify-otp", verifyOtp);

export default router;