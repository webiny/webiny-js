import { isRecord } from "./isRecord.js";

export interface MissingSetting {
    key: string;
    label: string;
}

const isMissing = (value: unknown): boolean => {
    return value === undefined || value === null || value === "";
};

/*
 * The required top-level settings of an automation's schema that are empty and have no default
 * (R276: `{Label} is required.`). The label is the property's `title`, else its key. Reads the
 * schema as plain data, so an odd schema yields nothing instead of throwing.
 */
export const getMissingRequiredSettings = (
    schema: unknown,
    settings: Record<string, unknown>
): MissingSetting[] => {
    if (!isRecord(schema) || !Array.isArray(schema.required)) {
        return [];
    }
    const properties = isRecord(schema.properties) ? schema.properties : {};
    const missing: MissingSetting[] = [];

    for (const key of schema.required) {
        if (typeof key !== "string") {
            continue;
        }
        const property = properties[key];
        const definition = isRecord(property) ? property : {};
        if ("default" in definition || !isMissing(settings[key])) {
            continue;
        }
        const title = definition.title;
        const label = typeof title === "string" && title !== "" ? title : key;
        missing.push({ key, label });
    }

    return missing;
};
