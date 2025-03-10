import { Request, Response } from "express";
import { getUsers } from "../models/useModel";
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    console.log({error})
    res.status(500).json({ error: "Lỗi server" });
  }
};
