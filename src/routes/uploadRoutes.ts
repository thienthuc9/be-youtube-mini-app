import express from "express";
import { uploadVideo, uploadMiddleware } from "../controllers/uploadController";

const router = express.Router();

router.post("/upload", uploadMiddleware, uploadVideo);

export default router;
