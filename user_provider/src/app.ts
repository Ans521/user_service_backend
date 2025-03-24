import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import {connectDb} from "./config/db";
import authRouter from "./routes/route";
import cookieParser from 'cookie-parser';
import path from 'path';
dotenv.config();
connectDb();

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/api", authRouter);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(cookieParser());

app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

export default app;
