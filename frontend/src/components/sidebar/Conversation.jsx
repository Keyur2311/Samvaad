import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";
import { useAuthContext } from "../../context/AuthContext";
import { extractTime } from "../../utils/extractTime";

// WhatsApp-style time for the sidebar: clock time today, date otherwise
const formatPreviewTime = (createdAt) => {
	const date = new Date(createdAt);
	if (date.toDateString() === new Date().toDateString()) return extractTime(createdAt);
	return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const Conversation = ({ conversation, lastIdx }) => {
	const { selectedConversation, setSelectedConversation, conversationsMeta } = useConversation();
	const { authUser } = useAuthContext();

	const isSelected = selectedConversation?._id === conversation._id;
	const { onlineUsers } = useSocketContext();
	const isOnline = onlineUsers.includes(conversation._id);

	const meta = conversationsMeta[conversation._id];
	const unread = meta?.unreadCount || 0;
	const last = meta?.lastMessage;

	const preview = last
		? `${last.senderId === authUser._id ? "You: " : ""}${last.message}`
		: "Tap to start the conversation";

	return (
		<>
			<div
				className={`flex gap-2 items-center hover:bg-sky-500 rounded p-2 py-1 cursor-pointer
					${isSelected ? "bg-sky-500" : ""}
				`}
				onClick={() => setSelectedConversation(conversation)}
			>
				<div className={`avatar ${isOnline ? "online" : ""}`}>
					<div className="w-12 rounded-full">
						<img src={conversation.profilePic} alt="user avatar" />
					</div>
				</div>

				<div className="flex flex-col flex-1 min-w-0">
					<div className="flex justify-between gap-3">
						<p className={`font-bold truncate ${unread ? "text-white" : "text-gray-200"}`}>
							{conversation.fullName}
						</p>
						{last && (
							<span className='text-xs text-gray-400 whitespace-nowrap self-center'>
								{formatPreviewTime(last.createdAt)}
							</span>
						)}
					</div>
					<div className='flex justify-between gap-2 items-center'>
						<p className={`text-sm truncate ${unread ? "font-semibold text-gray-300" : "text-gray-500"}`}>
							{preview}
						</p>
						{unread > 0 && (
							<span className='badge badge-sm badge-primary shrink-0'>{unread}</span>
						)}
					</div>
				</div>
			</div>

			{!lastIdx && <div className="divider my-0 py-0 h-1" />}
		</>
	);
};
export default Conversation;
