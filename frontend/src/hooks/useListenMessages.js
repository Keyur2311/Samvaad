import { useEffect } from "react";

import { useSocketContext } from "../context/SocketContext";
import useConversation from "../zustand/useConversation";

import notificationSound from "../assets/sounds/notification.mp3";

// build a partner's sidebar summary from a message — used for both the
// "message for a closed chat" and "message for the open chat" cases
const sidebarEntryFor = (message, unreadCount) => ({
	lastMessage: {
		message: message.message,
		createdAt: message.createdAt,
		senderId: message.senderId,
	},
	unreadCount,
});

const useListenMessages = () => {
	const { socket } = useSocketContext();
	const { selectedConversation, setMessages, setReadUpTo, setConversationsMeta } = useConversation();

	useEffect(() => {
		socket?.on("newMessage", (newMessage) => {
			const sound = new Audio(notificationSound);
			sound.play();

			const isOpenChat = selectedConversation?._id === newMessage.senderId;

			if (!isOpenChat) {
				// closed chat (or no chat open): never touch the open message
				// list, but keep the sidebar honest — new preview, one more
				// unread. The updater form is what makes two quick messages
				// count to 2 instead of overwriting each other at 1.
				setConversationsMeta((prev) => ({
					...prev,
					[newMessage.senderId]: sidebarEntryFor(
						newMessage,
						(prev[newMessage.senderId]?.unreadCount || 0) + 1
					),
				}));
				return;
			}

			// open chat: shake + append, refresh the sidebar preview, and the
			// unread stays 0 — I'm looking at it, so markAsRead (useMarkAsRead)
			// is stamping the server with the same fact this very instant
			newMessage.shouldShake = true;
			setConversationsMeta((prev) => ({
				...prev,
				[newMessage.senderId]: sidebarEntryFor(newMessage, 0),
			}));
			setMessages((prev) =>
				prev.some((m) => m._id === newMessage._id) ? prev : [...prev, newMessage]
			);
		});

		return () => socket?.off("newMessage");
		// no `messages` dep — updater forms read the latest state themselves
	}, [socket, selectedConversation?._id, setMessages, setConversationsMeta]);

	// READ RECEIPTS: `by` = the user who just looked at their chat with us —
	// everything we sent before `at` is read. Ignore events from anyone who
	// isn't the partner of the chat we have open.
	useEffect(() => {
		socket?.on("messagesRead", ({ by, at }) => {
			if (by !== selectedConversation?._id) return;
			setReadUpTo(at); // `at` is an ISO string; the setter normalizes it
		});

		return () => socket?.off("messagesRead");
	}, [socket, selectedConversation?._id, setReadUpTo]);
};
export default useListenMessages;
