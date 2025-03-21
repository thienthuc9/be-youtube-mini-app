import express from "express";
import {
  uploadVideo,
  uploadMiddleware,
  getSignedURL,
  setUrlDB,
} from "../controllers/uploadController";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/upload", uploadMiddleware, uploadVideo);
router.get("/get-upload-url", verifyToken, getSignedURL);
router.post("/save-videos", setUrlDB);
export default router;
