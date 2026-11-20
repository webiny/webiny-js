import { parseDecisions } from "./approvals.js";
import { parsePageContext } from "./parsePageContext.js";
import { parseClientTools } from "./clientTools/index.js";
import { parseToolResults } from "./clientTools/index.js";
import type { AdminAssistantParams } from "./abstractions.js";

const safeParse = (value: string): unknown => {
    try {
        return JSON.parse(value);
    } catch {
        return undefined;
    }
};

/**
 * Accepts a question, `{ chatId?, prompt, pageContext?, toolResults? }`, or what a paused run waits
 * for, `{ chatId, approvals?, toolResults? }`. Either can carry the screen's `clientTools`. A question
 * carries results when it replaces a run whose browser calls ran while it waited for an approval.
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
    const toolResults = parseToolResults(payload["toolResults"]);
    const clientTools = parseClientTools(payload["clientTools"]);
    const chatId = payload["chatId"];
    const prompt = payload["prompt"];

    const params: AdminAssistantParams = { decisions, clientTools, toolResults: [] };
    if (typeof chatId === "string" && chatId) {
        params.chatId = chatId;
    }

    if (typeof prompt === "string" && prompt.trim()) {
        params.prompt = prompt;
        if (params.chatId) {
            params.toolResults = toolResults;
        }
        const pageContext = parsePageContext(payload["pageContext"]);
        if (pageContext) {
            params.pageContext = pageContext;
        }
        return params;
    }

    // A decision or a result continues a run that was saved, so it needs the chat it was saved in.
    if ((decisions.length > 0 || toolResults.length > 0) && params.chatId) {
        params.toolResults = toolResults;
        /*
         * Results come from the screen that ran the calls, so its context is the page as they left
         * it. A decision alone comes from a card that may outlive the screen it was asked from.
         */
        const pageContext = toolResults.length > 0 && parsePageContext(payload["pageContext"]);
        if (pageContext) {
            params.pageContext = pageContext;
        }
        return params;
    }

    return null;
};
