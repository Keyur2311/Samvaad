import { Server } from "socket.io";
import http from "http";
import express from "express";

import Conversation from "../models/conversation.model.js";

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		// "*" must be a bare string — as ["*"] it becomes a whitelist entry
		// matching the literal origin "*" and CORS headers were never sent,
		// which silently broke every cross-origin socket connection
		origin: "*",
		methods: ["GET", "POST"],
	},
	transports: ["websocket", "polling"],
});

// {userId: Set<socketId>} — a user can be connected from several tabs/devices;
// every socket must receive their messages, and one tab closing must not
// unregister the others
const userSocketMap = {};

export const getReceiverSocketIds = (receiverId) => {
	const sockets = userSocketMap[receiverId];
	return sockets ? [...sockets] : [];
};

io.on("connection", (socket) => {
	console.log("a user connected", socket.id);

	const userId = socket.handshake.query.userId;
	if (userId != "undefined") {
		if (!userSocketMap[userId]) userSocketMap[userId] = new Set();
		userSocketMap[userId].add(socket.id);
	}

	// io.emit() is used to send events to all the connected clients
	io.emit("getOnlineUsers", Object.keys(userSocketMap));

	// READ RECEIPTS — the receiver says "I'm looking at my chat with this user".
	// The app speaks USER ids everywhere (no conversation ids in the client),
	// so we resolve the conversation by its participants — which doubles as
	// the authorization: the query includes the emitter, so a conversation
	// they're not part of simply isn't found.
	socket.on("markAsRead", async ({ otherUserId } = {}) => {
		try {
			if (!otherUserId) return;

			const conversation = await Conversation.findOne({
				participants: { $all: [userId, otherUserId] },
			});
			if (!conversation) return; // no chat between these two yet → nothing to read

			// conversations created before this feature have no lastRead field
			if (!conversation.lastRead) conversation.lastRead = new Map();

			// the SERVER's clock is the single source of truth for "when",
			// never the client's (clocks on different machines disagree)
			const readAt = new Date();
			conversation.lastRead.set(userId, readAt);
			await conversation.save();

			// notify the other participant's tabs so their ticks turn blue
			getReceiverSocketIds(otherUserId).forEach((socketId) =>
				io.to(socketId).emit("messagesRead", { by: userId, at: readAt })
			);
		} catch (error) {
			console.log("Error in markAsRead handler: ", error.message);
		}
	});

	// socket.on() is used to listen to the events. can be used both on client and server side
	socket.on("disconnect", () => {
		console.log("user disconnected", socket.id);
		const sockets = userSocketMap[userId];
		if (sockets) {
			sockets.delete(socket.id);
			if (sockets.size === 0) delete userSocketMap[userId];
		}
		io.emit("getOnlineUsers", Object.keys(userSocketMap));
	});
});

export { app, io, server };
