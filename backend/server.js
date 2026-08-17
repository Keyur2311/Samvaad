import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";

import connectToMongoDB from "./db/connectToMongoDB.js";
import { app, server } from "./socket/socket.js";

dotenv.config();

// PORT should be assigned after calling dotenv.config() because we need to access the env variables.
const PORT = process.env.PORT || 5000;

app.use(express.json()); // to parse the incoming requests with JSON payloads (from req.body)
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);

// health check / root route (frontend is deployed separately on Vercel)
app.get("/", (req, res) => {
	res.send("Samvaad API is running 🚀");
});

server.listen(PORT, () => {
	connectToMongoDB();
	console.log(`Server Running on port ${PORT}`);
});
