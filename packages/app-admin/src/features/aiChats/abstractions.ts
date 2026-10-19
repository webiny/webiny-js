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

export interface SaveAiChatInput {
    /** Omit it to start a new chat. */
    id?: string;
    /** The whole conversation so far, not only the newest turn. */
    messages: AdminAssistantMessage[];
}

/**
 * Calls the `aiPowerUps` chat operations. The api registers them only with the admin assistant
 * licensed, the same condition the palette checks before offering the assistant at all.
 */
export interface IAiChatsGateway {
    list(after?: string): Promise<AiChatsPage>;
    get(id: string): Promise<AiChat>;
    save(input: SaveAiChatInput): Promise<AiChatSummary>;
    delete(id: string): Promise<void>;
}

export const AiChatsGateway = createAbstraction<IAiChatsGateway>("AiChatsGateway");

export namespace AiChatsGateway {
    export type Interface = IAiChatsGateway;
    export type Page = AiChatsPage;
    export type SaveInput = SaveAiChatInput;
}

/**
 * The signed-in identity's saved chats, as one list everything shares.
 *
 * The assistant saves through it and the chats panel reads from it, so a chat saved after a turn
 * moves to the top of the panel without the panel asking the server again.
 */
export interface IAiChatsRepository {
    /** Newest first. Holds the pages read so far. */
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
    /** Save and put the chat at the top of the list. */
    save(input: SaveAiChatInput): Promise<AiChatSummary>;
    delete(id: string): Promise<void>;
}

export const AiChatsRepository = createAbstraction<IAiChatsRepository>("AiChatsRepository");

export namespace AiChatsRepository {
    export type Interface = IAiChatsRepository;
    export type Summary = AiChatSummary;
    export type Chat = AiChat;
    export type SaveInput = SaveAiChatInput;
}
