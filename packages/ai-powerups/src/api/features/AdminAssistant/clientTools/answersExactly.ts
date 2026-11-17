import type { ClientToolResult } from "./types.js";

/**
 * Whether the results answer every call still waiting, once each, and nothing else. A result for an
 * older call, or one missing, would hand the model a history the provider refuses.
 */
export const answersExactly = (
    results: ClientToolResult[],
    waiting: { toolCallId: string }[]
): boolean => {
    const ids = results.map(result => result.toolCallId);
    const answered = new Set(ids);
    if (answered.size !== results.length || answered.size !== waiting.length) {
        return false;
    }
    return waiting.every(call => answered.has(call.toolCallId));
};
