import { Server } from "socket.io";
import pool from "../config/db";
import redisClient from "../config/redis";

export default (io: Server) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // 📌 Xử lý like
    socket.on("like_video", async ({ userId, videoId }) => {
      try {
        const checkLikeQuery =
          "SELECT * FROM likes WHERE user_id = $1 AND video_id = $2";
        const likeResult = await pool.query(checkLikeQuery, [userId, videoId]);

        let isLiked = false;
        if (likeResult.rows.length > 0) {
          await pool.query(
            "DELETE FROM likes WHERE user_id = $1 AND video_id = $2",
            [userId, videoId]
          );
        } else {
          await pool.query(
            "INSERT INTO likes (user_id, video_id) VALUES ($1, $2)",
            [userId, videoId]
          );
          isLiked = true;
        }

        const countLikesQuery =
          "SELECT COUNT(*) AS likes FROM likes WHERE video_id = $1";
        const countResult = await pool.query(countLikesQuery, [videoId]);
        const likes = parseInt(countResult.rows[0].likes, 10) || 0;

        // 📌 Cập nhật cache
        const cacheKey = `video:${videoId}:detail`;
        const cachedVideo = await redisClient.get(cacheKey);
        if (cachedVideo) {
          let videoData = JSON.parse(cachedVideo);
          videoData.likes = likes;
          await redisClient.setEx(cacheKey, 60, JSON.stringify(videoData));
        }

        io.emit(`update_likes:${videoId}`, { videoId, likes });
        console.log(
          `User ${userId} ${
            isLiked ? "liked" : "unliked"
          } video ${videoId}. Total likes: ${likes}`
        );
      } catch (error) {
        console.error("Lỗi khi cập nhật like:", error);
      }
    });

    // 📌 Xử lý comment
    socket.on("comment_video", async ({ userId, videoId, text }) => {
      try {
        const insertCommentQuery =
          "INSERT INTO comments (user_id, video_id, content) VALUES ($1, $2, $3) RETURNING *";
        const commentResult = await pool.query(insertCommentQuery, [
          userId,
          videoId,
          text,
        ]);
        const newComment = commentResult.rows[0];
        console.log({ newComment });
        io.emit(`update_comments:${videoId}`, {
          ...newComment,
          user_id: userId,
        });
        console.log(`User ${userId} commented on video ${videoId}: ${text}`);
      } catch (error) {
        console.error("Lỗi khi thêm comment:", error);
      }
    });

    // 📌 Xử lý view
    socket.on("video_watched", async ({ userId, videoId }) => {
      console.log({ userId, videoId });
      try {
        await pool.query(
          "UPDATE videos SET views = views + 1 WHERE id = $1",
          [videoId]
        );

        const countViewsQuery =
          "SELECT views FROM videos WHERE id = $1";
        const countResult = await pool.query(countViewsQuery, [videoId]);
        const views = parseInt(countResult.rows[0].views, 10) || 0;

        const cacheKey = `video:${videoId}:detail`;
        const cachedVideo = await redisClient.get(cacheKey);
        if (cachedVideo) {
          let videoData = JSON.parse(cachedVideo);
          videoData.views = views;
          await redisClient.setEx(cacheKey, 60, JSON.stringify(videoData));
        }

        console.log(`Video ${videoId} now has ${views} views.`);
        // 🚀 Gửi lượt xem mới nhất về FE
        socket.emit(`video_views_updated:${videoId}`, { videoId, views });
      } catch (error) {
        console.error("Lỗi khi cập nhật view:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
