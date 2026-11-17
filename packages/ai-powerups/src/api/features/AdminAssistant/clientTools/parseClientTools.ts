import type { ClientToolDeclaration } from "./types.js";
import { isRecord } from "./isRecord.js";

const MAX_TOOLS = 20;
const NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/;
/**
 * A screen's tools, descriptions and schemas together. The page editor's are about 6000 characters;
 * the rest is room for a component catalog in a description.
 */
const MAX_DECLARATIONS_LENGTH = 64_000;

/**
 * Reads the client tools from a request body. Malformed entries are dropped one by one; a set too
 * big to send to a model is dropped whole, and the question is answered without them.
 */
export const parseClientTools = (value: unknown): ClientToolDeclaration[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    const declarations: ClientToolDeclaration[] = [];
    const names = new Set<string>();

    for (const entry of value.slice(0, MAX_TOOLS)) {
        if (!isRecord(entry)) {
            continue;
        }
        const { name, description, inputSchema } = entry;
        if (typeof name !== "string" || !NAME_PATTERN.test(name) || names.has(name)) {
            continue;
        }
        if (typeof description !== "string" || !description.trim()) {
            continue;
        }
        if (!isRecord(inputSchema) || inputSchema["type"] !== "object") {
            continue;
        }
        names.add(name);
        declarations.push({ name, description, inputSchema });
    }

    const serialized = JSON.stringify(declarations);
    if (serialized.length > MAX_DECLARATIONS_LENGTH) {
        return [];
    }

    return declarations;
};
