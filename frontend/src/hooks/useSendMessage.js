import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";

const useSendMessage = () => {
	const [loading, setLoading] = useState(false);
	const { setMessages, setConversationsMeta, selectedConversation } = useConversation();

	const sendMessage = async (message) => {
		setLoading(true);
		try {
			const res = await fetch(`/api/messages/send/${selectedConversation._id}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ message }),
			});
			const data = await res.json();
			if (data.error) throw new Error(data.error);

			// updater form so two quick sends can't overwrite each other
			setMessages((prev) => [...prev, data]);

			// my own sidebar preview follows my send
			setConversationsMeta((prev) => ({
				...prev,
				[selectedConversation._id]: {
					lastMessage: {
						message: data.message,
						createdAt: data.createdAt,
						senderId: data.senderId,
					},
					unreadCount: 0,
				},
			}));
		} catch (error) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};

	return { sendMessage, loading };
};
export default useSendMessage;
