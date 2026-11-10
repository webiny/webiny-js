import type { AiChatsRepository } from "~/features/aiChats/abstractions";

/**
 * An in-memory chats repository that records every save, so a test can see what the presenter
 * sent and in which order.
 */
export const createFakeChats = (chats: AiChatsRepository.Summary[] = []) => {
    const saves: AiChatsRepository.SaveInput[] = [];
    const stored = new Map<string, AiChatsRepository.Chat>();
    let nextId = 1;

    const repository: AiChatsRepository.Interface = {
        chats,
        hasMore: false,
        loading: false,
        error: null,
        async load() {},
        async loadMore() {},
        async get(id) {
            const chat = stored.get(id);
            if (!chat) {
                throw new Error(`Chat "${id}" was not found.`);
            }
            return chat;
        },
        async save(input) {
            saves.push(input);
            const id = input.id ?? `chat-${nextId++}`;
            const chat: AiChatsRepository.Chat = {
                id,
                title: "Chat",
                createdOn: "2026-10-19T10:00:00.000Z",
                savedOn: "2026-10-19T10:00:00.000Z",
                messages: input.messages
            };
            stored.set(id, chat);
            return { id, title: chat.title, createdOn: chat.createdOn, savedOn: chat.savedOn };
        },
        async delete(id) {
            stored.delete(id);
        }
    };

    return { repository, saves, stored };
};
