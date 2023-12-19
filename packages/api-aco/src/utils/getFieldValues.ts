import { CmsEntry } from "@webiny/api-headless-cms/types";
import { Filter } from "~/filter/filter.types";
import { Folder } from "~/folder/folder.types";
import { SearchRecord } from "~/record/record.types";

const pickBaseEntryFieldValues = (entry: CmsEntry, fieldNames: string[]) => {
    const pickedValues: Partial<CmsEntry> = {};
    for (const fieldName of fieldNames) {
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
            ...pickBaseEntryFieldValues(entry, baseFields),
            ...entry.values
        } as SearchRecord<any>;
    }

    return {
        ...entry,
        ...entry.values
    } as SearchRecord<any>;
}

export function getFolderFieldValues(entry: CmsEntry, baseFields: string[]) {
    return { ...pickBaseEntryFieldValues(entry, baseFields), ...entry.values } as Folder;
}

export function getFilterFieldValues(entry: CmsEntry, baseFields: string[]) {
    return {
        ...pickBaseEntryFieldValues(entry, baseFields),
        ...entry.values
    } as Filter;
}
