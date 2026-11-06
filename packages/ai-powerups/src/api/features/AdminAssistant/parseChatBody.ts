import type { ModelMessage } from "ai";
import { parseJson } from "@webiny/utils";
import { parseDecisions } from "./approvals.js";
import type { ApprovalDecision } from "./approvals.js";

export interface ParsedChatBody {
    messages: ModelMessage[];
    decisions: ApprovalDecision[];
}

const safeParse = (value: string): unknown => {
    try {
        // Rejects `__proto__` and `constructor.prototype` keys as well as invalid JSON.
        return parseJson(value);
    } catch {
        return undefined;
    }
};

/**
 * The route takes JSON only. A form or plain-text body is something a browser can send cross-site
 * without a preflight, so it is refused before the body is read.
 */
export const isJsonContentType = (headers: Record<string, string | undefined>): boolean => {
    const key = Object.keys(headers).find(name => name.toLowerCase() === "content-type");
    const value = key ? headers[key] : undefined;
    if (!value) {
        return false;
    }
    const mediaType = value.split(";")[0].trim().toLowerCase();
    return mediaType === "application/json";
};

/**
 * Accepts either a fresh question or a continuation. A continuation replays `messages` verbatim,
 * including the assistant message carrying the approval request, because the SDK matches an approval
 * response to its request by id and that request exists nowhere else. We keep no session.
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
