import { CmsIdentity } from "~/types";

export const ROOT_FOLDER = "root";

// Content entries - xOn and xBy meta fields.
export const ENTRY_META_FIELDS = [
    // Revision-level meta fields.
    "revisionCreatedOn",
    "revisionModifiedOn",
    "revisionSavedOn",
    "revisionFirstPublishedOn",
    "revisionLastPublishedOn",
    "revisionCreatedBy",
    "revisionModifiedBy",
    "revisionSavedBy",
    "revisionFirstPublishedBy",
    "revisionLastPublishedBy",

    // Entry-level meta fields.
    "createdOn",
    "modifiedOn",
    "savedOn",
    "firstPublishedOn",
    "lastPublishedOn",
    "createdBy",
    "modifiedBy",
    "savedBy",
    "firstPublishedBy",
    "lastPublishedBy"
] as const;

export type EntryMetaFieldName = (typeof ENTRY_META_FIELDS)[number];

export interface RecordWithEntryMetaFields {
    revisionCreatedOn: string;
    revisionSavedOn: string;
    revisionModifiedOn: string | null;
    revisionFirstPublishedOn: string | null;
    revisionLastPublishedOn: string | null;
    revisionCreatedBy: CmsIdentity;
    revisionSavedBy: CmsIdentity;
    revisionModifiedBy: CmsIdentity | null;
    revisionFirstPublishedBy: CmsIdentity | null;
    revisionLastPublishedBy: CmsIdentity | null;

    // Entry-level meta fields.
    createdOn: string;
    savedOn: string;
    modifiedOn: string | null;
    firstPublishedOn: string | null;
    lastPublishedOn: string | null;
    createdBy: CmsIdentity;
    savedBy: CmsIdentity;
    modifiedBy: CmsIdentity | null;
    firstPublishedBy: CmsIdentity | null;
    lastPublishedBy: CmsIdentity | null;
}

export const pickEntryMetaFields = (
    object: Partial<RecordWithEntryMetaFields>,
    filter?: (fieldName: string) => boolean
) => {
    const pickedEntryMetaFields: Partial<RecordWithEntryMetaFields> = {};
    for (const entryMetaFieldName of ENTRY_META_FIELDS) {
        if (entryMetaFieldName in object) {
            const mustPick = !filter || filter(entryMetaFieldName);
            if (mustPick) {
                Object.assign(pickedEntryMetaFields, {
                    [entryMetaFieldName]: object[entryMetaFieldName]
                });
            }
        }
    }

    return pickedEntryMetaFields;
};

export const isNullableEntryMetaField = (fieldName: EntryMetaFieldName) => {
    // Only modifiedX and publishedX fields are nullable.
    return fieldName.includes("Modified") || fieldName.includes("Published");
};

export const isDateTimeEntryMetaField = (fieldName: EntryMetaFieldName) => {
    // Only field ending with "On" are date/time fields.
    return fieldName.endsWith("On");
};

export const isIdentityEntryMetaField = (fieldName: EntryMetaFieldName) => {
    // Only field ending with "On" are date/time fields.
    return fieldName.endsWith("By");
};
