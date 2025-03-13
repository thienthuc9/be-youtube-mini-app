import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import uploadRoutes from "./routes/uploadRoutes";
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", uploadRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
