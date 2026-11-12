import type { ModelMessage } from "ai";

/** What the chats panel lists: enough to show a row and open the chat, without its messages. */
export interface AiChatSummary {
    id: string;
    title: string;
    createdOn: string;
    savedOn: string;
}

/**
 * A saved conversation. `messages` is the model history the assistant reads back to continue it,
 * including a run paused on an approval, which a decision then resumes.
 */
export interface AiChat extends AiChatSummary {
    messages: ModelMessage[];
}
