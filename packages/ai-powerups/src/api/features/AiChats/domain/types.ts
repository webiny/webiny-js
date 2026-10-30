import type { ModelMessage } from "ai";

/** What the chats panel lists: enough to show a row and open the chat, without its messages. */
export interface AiChatSummary {
    id: string;
    title: string;
    createdOn: string;
    savedOn: string;
}

/**
 * A saved conversation. `messages` is what the assistant replays, stored as the client sent it, so
 * opening a chat can continue it, including a turn paused on an approval.
 */
export interface AiChat extends AiChatSummary {
    messages: ModelMessage[];
}
