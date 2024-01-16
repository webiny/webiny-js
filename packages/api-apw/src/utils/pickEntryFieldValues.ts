import { CmsEntry } from "@webiny/api-headless-cms/types";

export const baseFields = [
    // Entry ID is mapped to "id" (we don't use revisions with ACO entities).
    "id",

    "createdOn",
    "modifiedOn",
    "savedOn",
    "createdBy",
    "modifiedBy",
    "savedBy"
];

const pickBaseEntryFieldValues = (entry: CmsEntry) => {
    const pickedValues: Partial<CmsEntry> = {};
    for (const fieldName of baseFields) {
        const [srcFieldName, targetFieldName = srcFieldName] = fieldName.split(":");
        if (srcFieldName in entry) {
            Object.assign(pickedValues, {
                [targetFieldName]: entry[srcFieldName as keyof CmsEntry]
            });
        }
    }

    return pickedValues;
};

export function pickEntryFieldValues<T>(entry: CmsEntry): T {
    return {
        ...pickBaseEntryFieldValues(entry),
        ...entry.values
    } as T;
}
