import express from "express";
import { uploadVideo, uploadMiddleware, getSignedURL, setUrlDB } from "../controllers/uploadController";

const router = express.Router();

router.post("/upload", uploadMiddleware, uploadVideo);
router.get("/get-upload-url",getSignedURL);
router.post("/save-videos",setUrlDB);
export default router;
