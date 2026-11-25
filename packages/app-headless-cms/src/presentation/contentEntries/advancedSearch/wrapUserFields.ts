import { FieldsMapper } from "./FieldsMapper.js";

function isSystemKey(key: string): boolean {
    return FieldsMapper.systemFieldIds.some(
        prefix => key === prefix || key.startsWith(`${prefix}_`)
    );
}

/*
 * Moves the conditions on model fields under `values`, where the entry list's where input expects
 * them. System fields, such as `createdBy`, stay at the top level.
 */
export function wrapUserFields(where: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const values: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(where)) {
        if (key === "AND" || key === "OR") {
            const conditions = value as Record<string, unknown>[];
            result[key] = conditions.map(item => wrapUserFields(item));
        } else if (isSystemKey(key)) {
            result[key] = value;
        } else {
            values[key] = value;
        }
    }

    if (Object.keys(values).length > 0) {
        result["values"] = values;
    }

    return result;
}
