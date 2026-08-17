import { create } from "zustand";

const useConversation = create((set) => ({
	selectedConversation: null,
	setSelectedConversation: (selectedConversation) => set({ selectedConversation }),
	messages: [],
	// accepts a new array OR an updater, e.g. setMessages((prev) => [...prev, msg])
	// the updater form avoids losing messages when two arrive before a re-render
	setMessages: (messages) =>
		set((state) => ({
			messages: typeof messages === "function" ? messages(state.messages) : messages,
		})),
	// READ RECEIPTS: "everything I sent before this instant was read by the
	// other person" — a Date, or null when they've never opened the chat
	readUpTo: null,
	setReadUpTo: (readUpTo) => set({ readUpTo: readUpTo ? new Date(readUpTo) : null }),

	// SIDEBAR: per-partner summary — { [partnerId]: { lastMessage, unreadCount } }.
	// Accepts a value or an updater, same as setMessages (socket handlers
	// need the updater form to avoid stale-closure overwrites)
	conversationsMeta: {},
	setConversationsMeta: (meta) =>
		set((state) => ({
			conversationsMeta: typeof meta === "function" ? meta(state.conversationsMeta) : meta,
		})),
}));

export default useConversation;
