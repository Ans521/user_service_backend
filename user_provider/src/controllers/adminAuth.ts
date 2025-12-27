import jwt from "jsonwebtoken";
const secretKey = '1n1b484n39886ni124114inai';

export const adminAuth = async (req: any, res: any) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password || !role) {
            return res.status(400).json({ status: "error", message: "Email and password are required" });
        }

        console.log("email", email, "password", password, "role", role);
        if (email !== 'localproo25@gmail.com' || password !== 'pp' || role !== 'admin') {
            return res.status(400).json({ message: "creadentials are not valid" });
        }

        const token = jwt.sign({ email, role }, secretKey, { expiresIn: '12h' });

        if (!token) {
            return res.status(500).json({ status: "error", message: "Failed to generate token" });
        }

        res.status(200).json({ token, message: "Logged in successfully" });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: "Internal server error" });
        console.log(error);
    }
}

export const authMe = async (req: any, res: any) => {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;
    console.log("Token from headers or cookies:", token);
    if (!token) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
    }
    console.log("Token received:", token);
    try {
        const decoded = jwt.verify(token, secretKey);
        return res.status(200).json({ status: "ok", user: decoded });
    } catch (error) {
        return res.status(401).json({ status: "error", message: "Invalid token" });
    }
}