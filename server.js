import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const PORT = process.env.PORT;

import userRoutes from './routes/userRoutes.js';

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/users", userRoutes);

app.listen(PORT, () => {
  console.log(`Server running in port ${process.env.PORT}`);
});
