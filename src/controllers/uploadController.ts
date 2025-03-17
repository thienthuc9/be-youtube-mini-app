import { Request, Response } from "express";
import { Storage } from "@google-cloud/storage";
import multer from "multer";
import { format } from "util";
import path from "path";
import dotenv from "dotenv";
import pool from "../config/db"; // Import kết nối DB

dotenv.config();

// Khởi tạo Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  keyFilename: process.env.GCLOUD_KEY_FILE,
});

const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET as string);

// Cấu hình Multer
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

// API Upload Video
export const uploadVideo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const blob = bucket.file(fileName);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: "video/mp4",
      },
    });
    let uploadedBytes = 0;
    const totalBytes = req.file.size;

    blobStream.on("progress", (event: any) => {
      uploadedBytes += event.bytesWritten;
      const percentCompleted = Math.round((uploadedBytes * 100) / totalBytes);
      console.log(`Upload progress: ${percentCompleted}%`);
    });



    blobStream.on("finish", async () => {
      const publicUrl = format(
        `https://storage.googleapis.com/${bucket.name}/${blob.name}`
      );
      // 📌 Lưu vào PostgreSQL
      const result = await pool.query(
        "INSERT INTO videos (title, url) VALUES ($1, $2) RETURNING *",
        [req.file?.originalname, publicUrl]
      );
      res.status(200).json({ message: "Upload successful", url: publicUrl });
    });

    blobStream.on("error", (err) => {
      console.error(err);
      res.status(500).json({ message: "Upload failed", error: err });
    });

    blobStream.end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Middleware Multer cho route
export const uploadMiddleware = upload.single("video");

// 📌 API lấy Signed URL để FE upload video
export const getSignedURL = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.mp4`;
    const file = bucket.file(fileName);

    const [url] = await file.getSignedUrl({
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 phút
      contentType: "video/mp4",
    });

    res.json({ uploadUrl: url, filePath: fileName });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
};

// API insert url to DB
export const setUrlDB = async(  
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { videoUrl,title } = req.body;

    if (!videoUrl) {
      res.status(400).json({ error: "Missing video URL" });
      return 
    }

      // 📌 Lưu vào PostgreSQL
      const result = await pool.query(
        "INSERT INTO videos (title, url) VALUES ($1, $2) RETURNING *",
        [title, videoUrl]
      );

      res.status(200).json({ message: "Upload successful", url: videoUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save video URL" });
  }
}