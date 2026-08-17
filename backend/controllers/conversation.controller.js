import Conversation from "../models/conversation.model.js";

// SIDEBAR DATA: for every chat I have — who it's with, the last message,
// and how many messages from the other person I haven't read yet.
// Computed entirely inside MongoDB via an aggregation pipeline: the
// database transforms the data and ships only the finished summary,
// not my entire message history.
export const getConversationsOverview = async (req, res) => {
	try {
		const me = req.user._id; // ObjectId, thanks to protectRoute
		const meStr = me.toString(); // lastRead Map keys are strings

		// JS maximum date — used as the default "lastRead" for chats I've
		// never opened: everything counts as read until my first visit,
		// so the feature doesn't mark my whole history unread at launch
		const READ_ALL = new Date(8640000000000000);

		const overview = await Conversation.aggregate([
			// stage 1: only MY conversations
			{ $match: { participants: me } },

			// stage 2: attach the actual messages of each conversation,
			// newest first (pipeline-form $lookup lets us sort)
			{
				$lookup: {
					from: "messages",
					let: { msgIds: "$messages" },
					pipeline: [
						{ $match: { $expr: { $in: ["$_id", "$$msgIds"] } } },
						{ $sort: { createdAt: -1 } },
					],
					as: "msgs",
				},
			},

			// stage 3: derive the fields the sidebar actually wants
			{
				$addFields: {
					// the other participant = the one that isn't me
					partnerId: {
						$arrayElemAt: [
							{ $filter: { input: "$participants", cond: { $ne: ["$$this", me] } } },
							0,
						],
					},
					// newest message of the chat (msgs is sorted newest-first)
					lastMessage: { $arrayElemAt: ["$msgs", 0] },
					// FROM THEM (not me) AND newer than MY last read → unread
					unreadCount: {
						$size: {
							$filter: {
								input: "$msgs",
								cond: {
									$and: [
										{ $ne: ["$$this.senderId", me] },
										{
											$gt: [
												"$$this.createdAt",
												{ $ifNull: [`$lastRead.${meStr}`, READ_ALL] },
											],
										},
									],
								},
							},
						},
					},
				},
			},

			// stage 4: ship only what the sidebar renders — no internals
			{
				$project: {
					_id: 0,
					partnerId: 1,
					unreadCount: 1,
					"lastMessage.message": 1,
					"lastMessage.createdAt": 1,
					"lastMessage.senderId": 1,
				},
			},
		]);

		res.status(200).json(overview);
	} catch (error) {
		console.log("Error in getConversationsOverview: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
