import express from "express";
import { verifyToken } from "../middleware/authMiddleware";
import { getVideoDetail, getVideoList } from "../controllers/videosController";

const router = express.Router();

router.get("/get-list-all", verifyToken,getVideoList);
router.get("/get-videos/:videoId", verifyToken, getVideoDetail);


export default router;