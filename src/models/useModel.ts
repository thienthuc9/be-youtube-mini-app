import pool from "../config/db";

export const getUsers = async () => {
  const result = await pool.query("SELECT * FROM users");
  return result.rows;
};