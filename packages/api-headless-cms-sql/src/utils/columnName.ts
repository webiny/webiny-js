import { createHash } from "crypto";
import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";

export interface IFieldColumnEntry {
    columnName: string;
    storageId: string;
    fieldId: string;
    type: string;
    path: string[];
}

/*
 * Converts an array of CMS field storage path segments to a SQL column name.
 *
 * - 1 segment  (top-level):  returned as-is.
 * - 2 segments (1 level nested):  joined with `__`.
 * - 3+ segments (2+ levels nested):  `top__{hash8}__leaf` where hash8 is
 *   the first 8 characters of the SHA-256 of the intermediate segments
 *   joined by `.`.
 */
export const storagePathToColumnName = (segments: string[]): string => {
    if (segments.length === 1) {
        return segments[0];
    }

    if (segments.length === 2) {
        return `${segments[0]}__${segments[1]}`;
    }

    const top = segments[0];
    const leaf = segments[segments.length - 1];
    const intermediates = segments.slice(1, -1);
    const hash8 = createHash("sha256").update(intermediates.join(".")).digest("hex").slice(0, 8);

    return `${top}__${hash8}__${leaf}`;
};

/*
 * Recursively walks the provided CMS model fields and builds a flat array of
 * IFieldColumnEntry objects.
 *
 * - object fields (type === "object" with settings.fields): recurse into
 *   children; no entry is created for the parent object itself.
 * - dynamicZone fields (type === "dynamicZone" with settings.templates):
 *   recurse into each template's fields.
 * - all other fields: emit one IFieldColumnEntry.
 */
export const buildFieldColumnMap = (
    fields: CmsModelField[],
    parentPath: string[] = []
): IFieldColumnEntry[] => {
    const entries: IFieldColumnEntry[] = [];

    for (const field of fields) {
        const currentPath = [...parentPath, field.storageId];

        if (field.type === "object" && field.settings?.fields) {
            const children = buildFieldColumnMap(field.settings.fields, currentPath);
            entries.push(...children);
            continue;
        }

        if (field.type === "dynamicZone" && field.settings?.templates) {
            for (const template of field.settings.templates) {
                const children = buildFieldColumnMap(template.fields, currentPath);
                entries.push(...children);
            }
            continue;
        }

        if (field.type === "ref") {
            const mainColumnName = storagePathToColumnName(currentPath);

            /* Main column stores the full ref JSON. */
            entries.push({
                columnName: mainColumnName,
                storageId: field.storageId,
                fieldId: field.fieldId,
                type: field.type,
                path: currentPath
            });

            /* Companion column stores the entryId for filtering. */
            entries.push({
                columnName: `${mainColumnName}__entryId`,
                storageId: field.storageId,
                fieldId: field.fieldId,
                type: "ref__entryId",
                path: currentPath
            });

            continue;
        }

        entries.push({
            columnName: storagePathToColumnName(currentPath),
            storageId: field.storageId,
            fieldId: field.fieldId,
            type: field.type,
            path: currentPath
        });
    }

    return entries;
};
