import { CmsEntry } from "~/migrations/5.39.0/001/types";
import {
    EntryMetaFieldName,
    isNonNullableEntryMetaField,
    pickEntryMetaFields
} from "@webiny/api-headless-cms/constants";

export const hasAllNonNullableValues = (entry: CmsEntry) => {
    // Only `modifiedX` and `publishedX` fields are nullable.
    const nonNullableMetaFields = pickEntryMetaFields(entry, isNonNullableEntryMetaField);

    for (const fieldName in nonNullableMetaFields) {
        const value = nonNullableMetaFields[fieldName as EntryMetaFieldName];
        if (!value) {
            return false;
        }
    }

    return true;
};
