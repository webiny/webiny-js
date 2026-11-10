import { createAbstraction } from "@webiny/feature/admin";
import type { AdminAssistantMessage } from "~/features/adminAssistant/abstractions.js";

/** A row in the chats panel. The messages stay on the server until the chat is opened. */
export interface AiChatSummary {
    id: string;
    title: string;
    createdOn: string;
    savedOn: string;
}

/** A saved conversation, with the messages the assistant replays to continue it. */
export interface AiChat extends AiChatSummary {
    messages: AdminAssistantMessage[];
}

export interface AiChatsPage {
    chats: AiChatSummary[];
    /** Pass it back to read the next page; `null` on the last one. */
    cursor: string | null;
}

/**
 * Why the assistant could not save a run: the chat is over the size the server stores, or the server
 * refused it for another reason.
 */
export type AiChatSaveFailure = "too-large" | "rejected";

/**
 * Calls the `aiPowerUps` chat operations. The api registers them only with the admin assistant
 * licensed, the same condition the palette checks before offering the assistant at all.
 */
export interface IAiChatsGateway {
    list(after?: string): Promise<AiChatsPage>;
    get(id: string): Promise<AiChat>;
    delete(id: string): Promise<void>;
}

export const AiChatsGateway = createAbstraction<IAiChatsGateway>("AiChatsGateway");

export namespace AiChatsGateway {
    export type Interface = IAiChatsGateway;
    export type Page = AiChatsPage;
}

/**
 * The signed-in identity's saved chats, as one list everything shares.
 *
 * The assistant tells it what it saved and the chats panel reads from it, so a chat the assistant
 * creates shows up in the panel without the panel asking the server again.
 */
export interface IAiChatsRepository {
    /** Newest created first, as the server lists them. Holds the pages read so far. */
    readonly chats: AiChatSummary[];
    readonly hasMore: boolean;
    readonly loading: boolean;
    /** Why the last read failed, until the next one starts. */
    readonly error: string | null;
    /** Read the first page again, dropping what was read before. */
    load(): Promise<void>;
    /** Read the page after the last one read. Does nothing on the last page. */
    loadMore(): Promise<void>;
    get(id: string): Promise<AiChat>;
    /** A chat the server saved: updated in the list, or put first if it is new. */
    remember(chat: AiChatSummary): void;
    delete(id: string): Promise<void>;
}

export const AiChatsRepository = createAbstraction<IAiChatsRepository>("AiChatsRepository");

export namespace AiChatsRepository {
    export type Interface = IAiChatsRepository;
    export type Summary = AiChatSummary;
    export type Chat = AiChat;
}
