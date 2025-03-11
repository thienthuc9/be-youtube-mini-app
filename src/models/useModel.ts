import pool from "../config/db";

export const getUsers = async () => {
  const result = await pool.query("SELECT * FROM users");
  return result.rows;
};
export interface User {
    id?: number;
    username: string;
    email: string;
    password: string;
  }