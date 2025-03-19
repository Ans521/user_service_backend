import express, { Request, Response } from "express";
import { getOtp } from "../controllers/userController";

const router = express.Router();

router.post("/otp", getOtp); 

export default router;
