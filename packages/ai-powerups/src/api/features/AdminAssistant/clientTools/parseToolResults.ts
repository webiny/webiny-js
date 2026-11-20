import type { ClientToolResult } from "./types.js";
import { isRecord } from "./isRecord.js";

/** One result. An editor reports what it changed, not the page. */
const MAX_RESULT_LENGTH = 32_000;

const parseResult = (entry: unknown): ClientToolResult | null => {
    if (!isRecord(entry)) {
        return null;
    }
    const { toolCallId, toolName, output, error } = entry;
    if (typeof toolCallId !== "string" || typeof toolName !== "string") {
        return null;
    }

    const result: ClientToolResult = { toolCallId, toolName };
    if (typeof error === "string" && error) {
        result.error = error;
        return result;
    }

    const serialized = JSON.stringify(output ?? null);
    if (serialized.length > MAX_RESULT_LENGTH) {
        result.error = "The result was too large to send back.";
        return result;
    }
    result.output = output ?? null;
    return result;
};

/** Reads the browser's results from a request body, dropping malformed entries. */
export const parseToolResults = (value: unknown): ClientToolResult[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    const results: ClientToolResult[] = [];
    for (const entry of value) {
        const result = parseResult(entry);
        if (result) {
            results.push(result);
        }
    }
    return results;
};
