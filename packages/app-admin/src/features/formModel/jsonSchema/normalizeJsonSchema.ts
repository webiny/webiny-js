import type { JsonSchema } from "./JsonSchema.js";

/*
 * A schema value that is not an object (a stored `null`, a boolean schema) has no keywords the
 * adapter can read, so it becomes the empty schema, which renders as a JSON text field.
 */
export const normalizeJsonSchema = (schema: unknown): JsonSchema => {
    if (typeof schema === "object" && schema !== null && !Array.isArray(schema)) {
        const normalized = schema as JsonSchema;
        return normalized;
    }
    return {};
};
