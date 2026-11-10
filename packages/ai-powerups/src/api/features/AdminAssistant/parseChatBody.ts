import { parseDecisions } from "./approvals.js";
import type { AdminAssistantParams } from "./abstractions.js";

const safeParse = (value: string): unknown => {
    try {
        return JSON.parse(value);
    } catch {
        return undefined;
    }
};

/**
 * Accepts a question, `{ chatId?, prompt }`, or a decision on a paused run, `{ chatId, approvals }`.
 * The history is never in the body: the use case reads it from the saved chat.
 *
 * Returns null for anything unusable, so the caller decides the status code.
 */
export const parseChatBody = (body: unknown): AdminAssistantParams | null => {
    const raw = typeof body === "string" ? safeParse(body) : body;
    const payload = raw as Record<string, unknown> | undefined;

    if (!payload) {
        return null;
    }

    const decisions = parseDecisions(payload["approvals"]);
    const chatId = payload["chatId"];
    const prompt = payload["prompt"];

    const params: AdminAssistantParams = { decisions };
    if (typeof chatId === "string" && chatId) {
        params.chatId = chatId;
    }

    if (typeof prompt === "string" && prompt.trim()) {
        params.prompt = prompt;
        return params;
    }

    // A decision continues a run that was saved, so it needs the chat it was saved in.
    if (decisions.length > 0 && params.chatId) {
        return params;
    }

    return null;
};
