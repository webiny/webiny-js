import type { JsonSchema } from "@webiny/app-admin/features/formModel/jsonSchema/JsonSchema.js";

const isJsonSchema = (value: unknown): value is JsonSchema => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

/*
 * The server sends a JSON schema as untyped JSON. An object is a schema; `null` and anything else
 * (no schema, a malformed value) is no schema, so the editor shows no generated form for it.
 */
export const toJsonSchema = (value: unknown): JsonSchema | null => {
    if (isJsonSchema(value)) {
        return value;
    }
    return null;
};
