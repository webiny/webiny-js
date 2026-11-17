import type { ModelMessage } from "ai";

interface Part {
    type?: unknown;
    toolCallId?: unknown;
    toolName?: unknown;
}

const partsOf = (message: ModelMessage): Part[] => {
    if (!Array.isArray(message.content)) {
        return [];
    }
    const parts: Part[] = message.content;
    return parts;
};

/**
 * Tool calls in a saved chat that nothing answers yet, in the order they were made: the calls the
 * browser was asked to run. A call that waits for approval has no result either, but it is answered
 * by the decision, so it is left out.
 */
export const unansweredClientCalls = (
    messages: ModelMessage[]
): { toolCallId: string; toolName: string }[] => {
    const calls: { toolCallId: string; toolName: string }[] = [];
    const answered = new Set<string>();

    for (const message of messages) {
        for (const part of partsOf(message)) {
            if (typeof part.toolCallId !== "string") {
                continue;
            }
            if (part.type === "tool-call" && typeof part.toolName === "string") {
                calls.push({ toolCallId: part.toolCallId, toolName: part.toolName });
            }
            if (part.type === "tool-result" || part.type === "tool-approval-request") {
                answered.add(part.toolCallId);
            }
        }
    }

    return calls.filter(call => !answered.has(call.toolCallId));
};
