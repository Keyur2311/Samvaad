import { useAuthContext } from "../../context/AuthContext";
import { extractTime } from "../../utils/extractTime";
import useConversation from "../../zustand/useConversation";
import { BsCheck2, BsCheck2All } from "react-icons/bs";

const Message = ({ message }) => {
	const { authUser } = useAuthContext();
	const { selectedConversation, readUpTo } = useConversation();
	const fromMe = message.senderId === authUser._id;
	const formattedTime = extractTime(message.createdAt);
	const chatClassName = fromMe ? "chat-end" : "chat-start";
	const profilePic = fromMe ? authUser.profilePic : selectedConversation?.profilePic;
	const bubbleBgColor = fromMe ? "bg-blue-500" : "";

	const shakeClass = message.shouldShake ? "shake" : "";

	// READ RECEIPTS: blue double-check once the other person has looked at
	// this chat AFTER this message was sent — derived from two facts at
	// render time, never stored per message
	const isRead = fromMe && readUpTo && new Date(message.createdAt) <= readUpTo;

	return (
		<div className={`chat ${chatClassName}`}>
			<div className='chat-image avatar'>
				<div className='w-10 rounded-full'>
					<img alt='Tailwind CSS chat bubble component' src={profilePic} />
				</div>
			</div>
			<div className={`chat-bubble text-white ${bubbleBgColor} ${shakeClass} pb-2`}>{message.message}</div>
			<div className='chat-footer opacity-50 text-xs flex gap-1 items-center'>
				{formattedTime}
				{fromMe &&
					(isRead ? (
						<BsCheck2All className='text-blue-400' size={15} />
					) : (
						<BsCheck2 className='text-gray-400' size={15} />
					))}
			</div>
		</div>
	);
};
export default Message;
