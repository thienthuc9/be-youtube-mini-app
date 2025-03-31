import express from "express";
import cors from "cors";
import http from "http";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import videosRoutes from "./routes/videosRoutes";
import { Server as SocketServer } from "socket.io";
import videoSocket from "./socketIo/videoIO"; // Import từ thư mục sockets
const app = express();
const server = http.createServer(app);
app.use(cors());
app.use(express.json());

app.use("/api", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", uploadRoutes);
app.use("/api",videosRoutes)

const io = new SocketServer(server, {
  cors: {
    origin: "*", // Cấu hình CORS phù hợp với yêu cầu của bạn
  },
});

// Gọi hàm videoSocket để thiết lập các sự kiện socket
videoSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
