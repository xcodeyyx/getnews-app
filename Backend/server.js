import express from "express";
import cors from "cors";
import http from "http";
import authRoutes from "./Routes/authRoutes.js";
import { supabase } from "./Database/Config.js";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
app.use(cors({
    origin: ["http://localhost:5173"], // Ganti dengan IP laptop
    methods: ["GET", "POST"],
    credentials: true
}));

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"],
        methods: ["GET", "POST"],
    },
});
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
// SOCKET.IO EVENT
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", ({ myid, friendId }) => {
        const room = [myid, friendId].sort().join("_");
        socket.join(room);
        console.log(`${myid} joined room: ${room}`);
    });

    socket.on("sendMessage", async (messageData) => {
        const { sender, receiver, text } = messageData;
        const room = [sender, receiver].sort().join("_");

        const { data, error } = await supabase
            .from("chats")
            .insert([{ pemilik_pesan: sender,sender_id: sender, receiver_id: receiver, message: text }])
            .select("*");
        if (error) {
            console.error("Database error:", error);
            return;
        }

        io.to(room).emit("receiveMessage", data[0]);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});
// Jalankan server
server.listen(5000, () => console.log("Server running on port 5000"));
