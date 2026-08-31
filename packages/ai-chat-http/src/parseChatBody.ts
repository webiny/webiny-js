import type { ModelMessage } from "ai";
import { parseDecisions } from "@webiny/ai-chat/api/index.js";
import type { ApprovalDecision } from "@webiny/ai-chat/api/index.js";

export interface ParsedChatBody {
    messages: ModelMessage[];
    decisions: ApprovalDecision[];
}

const safeParse = (value: string): unknown => {
    try {
        return JSON.parse(value);
    } catch {
        return undefined;
    }
};

/**
 * Accepts either a fresh question or a continuation. A continuation replays `messages` verbatim —
 * including the assistant message carrying the approval request — because the SDK matches an approval
 * response to its request by id, and that request exists nowhere else. We keep no session.
 *
 * Returns null for anything unusable, so the caller decides the status code.
 */
export const parseChatBody = (body: unknown): ParsedChatBody | null => {
    const raw = typeof body === "string" ? safeParse(body) : body;
    const payload = raw as Record<string, unknown> | undefined;

    if (!payload) {
        return null;
    }

    const decisions = parseDecisions(payload["approvals"]);
    const prompt = payload["prompt"];

    if (typeof prompt === "string" && prompt.trim()) {
        return { messages: [{ role: "user", content: prompt }], decisions };
    }

    const messages = payload["messages"];

    if (!Array.isArray(messages) || messages.length === 0) {
        return null;
    }

    return { messages: messages as ModelMessage[], decisions };
};
