import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db";
import dotenv from "dotenv";

dotenv.config();

// Đăng ký người dùng
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email, password } = req.body;
  
      const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (rows.length) {
        res.status(400).json({ message: "Email đã tồn tại" });
        return;
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const { rows: newUser } = await pool.query(
        "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email",
        [username, email, hashedPassword]
      );
  
      res.status(201).json({ message: "Đăng ký thành công", user: newUser[0] });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi";
        res.status(500).json({ message: "Lỗi server", error: errorMessage });
    }
  };
  

// Đăng nhập người dùng
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
  
      const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (!rows.length) {
        res.status(400).json({ message: "Email không tồn tại" });
        return;
      }
  
      const user = rows[0];
  
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        res.status(400).json({ message: "Mật khẩu không đúng" });
        return;
      }
  
      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET as string, { expiresIn: "7d" });
  
      res.status(200).json({ message: "Đăng nhập thành công", token, user: { id: user.id, email: user.email, username: user.username } });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi";
        res.status(500).json({ message: "Lỗi server", error: errorMessage });
    }
  };
  
