import express from "express";
import { getAllUsers, getUserInfo } from "../controllers/userController";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/users", getAllUsers);
router.get("/user-info", verifyToken, getUserInfo);

export default router;
