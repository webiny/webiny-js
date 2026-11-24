import type { ModelMessage } from "ai";

const MAX_TITLE_LENGTH = 80;
const UNTITLED = "Untitled chat";

/*
 * Saving checks only each message's role, so content is read defensively: a client can send any
 * shape, and a bad first message should cost the chat its title, not the save.
 */
const textOf = (message: ModelMessage): string => {
    const content: unknown = message.content;
    if (typeof content === "string") {
        return content;
    }
    if (!Array.isArray(content)) {
        return "";
    }

    const parts: string[] = [];
    for (const part of content) {
        if (part?.type === "text" && typeof part.text === "string") {
            parts.push(part.text);
        }
    }
    return parts.join(" ");
};

/**
 * The first question, on one line and cut to fit a row in the chats panel. No model call: the title
 * only has to tell chats apart, and the first question usually does.
 */
export const deriveChatTitle = (messages: ModelMessage[]): string => {
    const first = messages.find(message => message.role === "user");
    if (!first) {
        return UNTITLED;
    }

    const text = textOf(first).replace(/\s+/g, " ").trim();
    if (!text) {
        return UNTITLED;
    }

    if (text.length <= MAX_TITLE_LENGTH) {
        return text;
    }

    const cut = text.slice(0, MAX_TITLE_LENGTH - 1).trimEnd();
    return `${cut}…`;
};
