import { useEffect, useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";

const useGetMessages = () => {
	const [loading, setLoading] = useState(false);
	const { messages, setMessages, setReadUpTo, selectedConversation } = useConversation();

	useEffect(() => {
		const getMessages = async () => {
			setLoading(true);
			try {
				// clear BEFORE fetching, so switching chats never flashes
				// the previous conversation's messages or read-state
				setMessages([]);
				setReadUpTo(null);

				const res = await fetch(`/api/messages/${selectedConversation._id}`);
				const data = await res.json();
				if (data.error) throw new Error(data.error);
				setMessages(data.messages);
				setReadUpTo(data.readUpTo);
			} catch (error) {
				toast.error(error.message);
			} finally {
				setLoading(false);
			}
		};

		if (selectedConversation?._id) getMessages();
	}, [selectedConversation?._id, setMessages, setReadUpTo]);

	return { messages, loading };
};
export default useGetMessages;
