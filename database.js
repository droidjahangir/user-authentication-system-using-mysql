import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql
  .createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  })
  .promise();

export const getUserByUserId = async (id) => {
  const [user] = await pool.query(
    `
    SELECT * 
    FROM users
    WHERE id = ?
    `,
    [id]
  );

  return user[0];
};
