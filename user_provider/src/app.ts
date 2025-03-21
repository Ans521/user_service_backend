import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import {connectDb} from "./config/db";
import authRouter from "./routes/route";

dotenv.config();
connectDb();

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/api", authRouter);

app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

export default app;
