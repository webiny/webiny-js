import { CmsEntry } from "@webiny/api-headless-cms/types";
import { Filter } from "~/filter/filter.types";
import { Folder } from "~/folder/folder.types";
import { SearchRecord } from "~/record/record.types";

const baseFields = [
    // Entry ID is mapped to "id" (we don't use revisions with ACO entities).
    "id",

    // On/by fields are mapped to entry-level fields (we use ":" to signal that).
    "entryCreatedOn:createdOn",
    "entryModifiedOn:modifiedOn",
    "entrySavedOn:savedOn",
    "entryCreatedBy:createdBy",
    "entryModifiedBy:modifiedBy",
    "entrySavedBy:savedBy"
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

export function getRecordFieldValues(entry: CmsEntry<any>, baseFields?: string[]) {
    if (baseFields) {
        return {
            ...pickBaseEntryFieldValues(entry),
            ...entry.values
        } as SearchRecord<any>;
    }

    return {
        ...entry,
        ...entry.values
    } as SearchRecord<any>;
}

export function getFolderFieldValues(entry: CmsEntry) {
    return { ...pickBaseEntryFieldValues(entry), ...entry.values } as Folder;
}

export function getFilterFieldValues(entry: CmsEntry) {
    return {
        ...pickBaseEntryFieldValues(entry),
        ...entry.values
    } as Filter;
}
