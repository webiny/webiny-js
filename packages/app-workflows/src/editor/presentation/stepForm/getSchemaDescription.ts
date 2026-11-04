import type { JsonSchema } from "@webiny/app-admin";
import { isRecord } from "~/editor/model/isRecord.js";

// The settings schema's top-level `description` (definitions have no description field, R274), or null.
export const getSchemaDescription = (schema: JsonSchema | null): string | null => {
    const record: unknown = schema;
    if (!isRecord(record)) {
        return null;
    }
    const description = record.description;
    if (typeof description === "string" && description !== "") {
        return description;
    }
    return null;
};
