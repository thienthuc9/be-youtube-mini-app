import { Request, Response } from "express";
import { getUsers } from "../models/useModel";
import redis from "../config/redis";
import pool from "../config/db";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: any;
}
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    console.log({error})
    res.status(500).json({ error: "Lỗi server" });
  }
};
export const getUserInfo = async (req: AuthRequest, res: Response) => {
  try {
    // Lấy token từ header
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "Unauthorized - No token provided" });
      return 
    }

    // Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
    req.user = decoded;

    const userId = req.user.id;
    const cacheKey = `user:${userId}`;

    // 📌 Kiểm tra cache Redis
    const cachedUser = await redis.get(cacheKey);
    if (cachedUser) {
      console.log("Lấy dữ liệu từ Redis cache");
      res.json({ success: true, user: JSON.parse(cachedUser) });
      return 
    }

    // 📌 Nếu không có cache, lấy dữ liệu từ PostgreSQL
    const { rows } = await pool.query(
      "SELECT id, email, username, avatar FROM users WHERE id = $1",
      [userId]
    );

    if (rows.length === 0) {
      res.status(404).json({ message: "User not found" });
      return 
    }

    const user = rows[0];

    // 📌 Lưu vào Redis với thời gian sống 1 giờ (3600 giây)
    await redis.setEx(cacheKey, 3600, JSON.stringify(user));

    console.log("Lưu dữ liệu vào Redis cache");
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};