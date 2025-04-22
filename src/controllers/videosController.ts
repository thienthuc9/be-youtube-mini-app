import { Request, Response } from "express";
import redisClient from "../config/redis";
import pool from "../config/db"; // Kết nối PostgreSQL
import jwt from "jsonwebtoken";
interface AuthRequest extends Request {
  user?: any;
}
export const getVideoList = async (req: Request, res: Response) => {
  try {
    const cacheKey = "videos:list"; // 🔹 Cache toàn bộ danh sách video

    // 📌 Kiểm tra cache Redis
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log("Lấy danh sách video từ cache Redis");
      res.json({ success: true, videos: JSON.parse(cachedData) });
      return 
    }

    // 📌 Lấy danh sách video từ PostgreSQL
    const { rows } = await pool.query(
      "SELECT id, title, thumbnail,views FROM videos ORDER BY created_at DESC"
    );

    // 📌 Lưu vào Redis (TTL = 60 giây)
    await redisClient.setEx(cacheKey, 60, JSON.stringify(rows));

    console.log("Lưu danh sách video vào cache Redis");
    res.json({ success: true, videos: rows });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách video:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
export const getVideoDetail = async (req: Request, res: Response) => {
    try {
      const { videoId } = req.params;
      const cacheKey = `video:${videoId}:detail`;
  
      // 📌 Kiểm tra cache Redis trước
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log("Lấy từ cache Redis");
        res.json(JSON.parse(cachedData));
        return 
      }
  
      // 📌 Lấy thông tin video từ database
      const videoQuery = `
        SELECT id, title, description, url, views, created_at 
        FROM videos WHERE id = $1
      `;
      const videoResult = await pool.query(videoQuery, [videoId]);
      if (videoResult.rows.length === 0) {
        res.status(404).json({ message: "Video not found" });
        return 
      }
      const video = videoResult.rows[0];
  
      // 📌 Lấy tổng số lượt like
      const likeQuery = `SELECT COUNT(*) AS likes FROM likes WHERE video_id = $1`;
      const likeResult = await pool.query(likeQuery, [videoId]);
      video.likes = parseInt(likeResult.rows[0].likes, 10) || 0;
  
      // 📌 Lấy danh sách comment (chỉ lấy 10 comment gần nhất)
      const commentQuery = `
        SELECT c.id, c.content, c.created_at, u.username, u.avatar 
        FROM comments c 
        JOIN users u ON c.user_id = u.id 
        WHERE c.video_id = $1 
        ORDER BY c.created_at DESC 
        LIMIT 10
      `;
      const commentResult = await pool.query(commentQuery, [videoId]);
      video.comments = commentResult.rows;
  
      // 📌 Lưu vào Redis cache (TTL = 60 giây)
      await redisClient.setEx(cacheKey, 60, JSON.stringify(video));
  
      console.log("Lưu vào cache Redis");
      res.json(video);
    } catch (error) {
      console.error("Lỗi lấy video detail:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
  export const getVideoListByUserId = async (req: AuthRequest, res: Response) => {
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
        const cacheKey = `videos/detail:${userId}`;
  
      // 📌 Kiểm tra cache Redis
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log("Lấy danh sách video từ cache Redis");
        res.json({ success: true, videos: JSON.parse(cachedData) });
        return 
      }
  
      // 📌 Lấy danh sách video từ PostgreSQL
       const { rows } = await pool.query(
        "SELECT id, title, thumbnail, views FROM videos WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
      );
  
      // 📌 Lưu vào Redis (TTL = 60 giây)
      await redisClient.setEx(cacheKey, 60, JSON.stringify(rows));
  
      console.log("Lưu danh sách video vào cache Redis");
      res.json({ success: true, videos: rows });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách video:", error);
      res.status(500).json({ message: "Lỗi server" });
    }
  };