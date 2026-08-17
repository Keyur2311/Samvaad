import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
	{
		participants: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		messages: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Message",
				default: [],
			},
		],
		// read receipts: last time each participant looked at this chat.
		// A message is "read" when createdAt <= lastRead[receiverId],
		// so marking a whole chat read is ONE timestamp write.
		lastRead: {
			type: Map, // keys are userId strings, values are Dates
			of: Date,
			default: {},
		},
	},
	{ timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
