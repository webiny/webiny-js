import type { JsonSchema } from "@webiny/app-admin/features/formModel/jsonSchema/JsonSchema.js";
import { isRecord } from "./isRecord.js";

// The top-level settings of an automation's schema that carry the `team` ui hint (R271, R284).
export const getTeamSettingKeys = (schema: JsonSchema | null): string[] => {
    const record: unknown = schema;
    if (!isRecord(record) || !isRecord(record.properties)) {
        return [];
    }
    return Object.entries(record.properties)
        .filter(([, property]) => isRecord(property) && property.ui === "team")
        .map(([key]) => key);
};
