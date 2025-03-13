import { Request, Response } from "express";
import { Storage } from "@google-cloud/storage";
import multer from "multer";
import { format } from "util";
import path from "path";
import dotenv from "dotenv";

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
export const uploadVideo = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }
  
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const blob = bucket.file(fileName);
      
      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: req.file.mimetype || "video/mp4", // Đảm bảo luôn có Content-Type
        },
        resumable: false, // Tắt resumable để upload nhanh hơn
      });
  
      blobStream.on("error", (err) => {
        console.error(err);
        res.status(500).json({ message: "Upload failed", error: err });
      });
  
      blobStream.on("finish", async () => {
        // Tạo URL công khai
        await blob.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
  
        res.status(200).json({ message: "Upload successful", url: publicUrl });
      });
  
      blobStream.end(req.file.buffer);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };
  

// Middleware Multer cho route
export const uploadMiddleware = upload.single("video");
