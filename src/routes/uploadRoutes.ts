import express from "express";
import {
  uploadVideo,
  uploadMiddleware,
  getSignedURL,
  setUrlDB,
  deleteVideo,
} from "../controllers/uploadController";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/upload", uploadMiddleware, uploadVideo);
router.get("/get-upload-url", verifyToken, getSignedURL);
router.put("/remove-videos/:videoId",verifyToken,deleteVideo)
router.post("/save-videos", setUrlDB);
export default router;
