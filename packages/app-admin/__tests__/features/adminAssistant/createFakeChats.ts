import type { AiChatsRepository } from "~/features/aiChats/abstractions";

/**
 * An in-memory chats repository. It records every chat the presenter tells it was saved, and opens
 * the chats a test puts in it.
 */
export const createFakeChats = (chats: AiChatsRepository.Summary[] = []) => {
    const remembered: AiChatsRepository.Summary[] = [];
    const stored = new Map<string, AiChatsRepository.Chat>();

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
        remember(chat) {
            remembered.push(chat);
        },
        async delete(id) {
            stored.delete(id);
        }
    };

    const put = (chat: AiChatsRepository.Chat): void => {
        stored.set(chat.id, chat);
    };

    return { repository, remembered, put };
};
