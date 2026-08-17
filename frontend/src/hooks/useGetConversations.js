import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useConversation from "../zustand/useConversation";

const useGetConversations = () => {
	const [loading, setLoading] = useState(false);
	const [conversations, setConversations] = useState([]);
	const { setConversationsMeta } = useConversation();

	useEffect(() => {
		const getConversations = async () => {
			setLoading(true);
			try {
				// two independent requests — fire them in PARALLEL, not one
				// after the other (total latency = slowest, not the sum)
				const [usersRes, convosRes] = await Promise.all([
					fetch("/api/users"),
					fetch("/api/conversations"),
				]);

				const users = await usersRes.json();
				if (users.error) throw new Error(users.error);

				const convos = await convosRes.json();
				if (convos.error) throw new Error(convos.error);

				// index the overview by partner id → O(1) lookups when the
				// list renders, instead of a .find() per row
				const meta = {};
				convos.forEach((c) => {
					meta[c.partnerId] = { lastMessage: c.lastMessage, unreadCount: c.unreadCount };
				});

				setConversations(users);
				setConversationsMeta(meta);
			} catch (error) {
				toast.error(error.message);
			} finally {
				setLoading(false);
			}
		};

		getConversations();
	}, [setConversationsMeta]);

	return { loading, conversations };
};
export default useGetConversations;
