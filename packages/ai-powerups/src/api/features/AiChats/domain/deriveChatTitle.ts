import type { ModelMessage } from "ai";

const MAX_TITLE_LENGTH = 80;
const UNTITLED = "Untitled chat";

const textOf = (message: ModelMessage): string => {
    if (typeof message.content === "string") {
        return message.content;
    }

    const parts: string[] = [];
    for (const part of message.content) {
        if (part.type === "text") {
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
