import { useEffect } from "react";
import { useSocketContext } from "../context/SocketContext";
import useConversation from "../zustand/useConversation";

// READ RECEIPTS: tell the server "I'm looking at my chat with this user now".
// One effect covers both trigger moments — opening the chat AND a new
// message landing while it's open — because either way, the partner
// changed or the message count grew, and both mean: stamp it read.
const useMarkAsRead = () => {
	const { socket } = useSocketContext();
	const { selectedConversation, messages, setConversationsMeta } = useConversation();

	// NOTE: in this app the "selected conversation" IS the other user's
	// object — the app is keyed by user ids, not conversation ids
	const partnerId = selectedConversation?._id;

	useEffect(() => {
		if (!socket || !partnerId) return;

		socket.emit("markAsRead", { otherUserId: partnerId });

		// OPTIMISTIC UI: clear the badge locally right now instead of
		// re-fetching the sidebar — the server stamp we just requested and
		// this local change describe the same fact, so they can't disagree
		setConversationsMeta((prev) =>
			prev[partnerId]
				? { ...prev, [partnerId]: { ...prev[partnerId], unreadCount: 0 } }
				: prev
		);
	}, [socket, partnerId, messages.length, setConversationsMeta]);
};

export default useMarkAsRead;

