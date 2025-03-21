import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: any;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Unauthorized - No token provided" });
    return; // ✅ Luôn return sau khi gửi response
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
    req.user = decoded;
    next(); // ✅ Luôn gọi next() nếu token hợp lệ
  } catch (error) {
    res.status(401).json({ message: "Unauthorized - Invalid token" });
    return; // ✅ Tránh việc hàm có thể tiếp tục chạy sau response
  }
};
