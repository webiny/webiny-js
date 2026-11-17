import type { ClientToolResult } from "./types.js";

/**
 * Whether the results answer every call still waiting, once each, under the tool it called, and
 * nothing else. A result for an older call, one missing, or one saved under another tool's name would
 * hand the model a history the provider refuses or misreads.
 */
export const answersExactly = (
    results: ClientToolResult[],
    waiting: { toolCallId: string; toolName: string }[]
): boolean => {
    const names = new Map(results.map(result => [result.toolCallId, result.toolName]));
    if (names.size !== results.length || names.size !== waiting.length) {
        return false;
    }
    return waiting.every(call => names.get(call.toolCallId) === call.toolName);
};
