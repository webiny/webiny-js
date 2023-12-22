import { CmsIdentity } from "~/types";

export const ROOT_FOLDER = "root";

// Content entries - xOn and xBy meta fields.
export const ENTRY_META_FIELDS = [
    // Revision-level meta fields.
    "revisionCreatedOn",
    "revisionSavedOn",
    "revisionModifiedOn",
    "revisionFirstPublishedOn",
    "revisionLastPublishedOn",
    "revisionCreatedBy",
    "revisionSavedBy",
    "revisionModifiedBy",
    "revisionFirstPublishedBy",
    "revisionLastPublishedBy",

    // Entry-level meta fields.
    "entryCreatedOn",
    "entrySavedOn",
    "entryModifiedOn",
    "entryFirstPublishedOn",
    "entryLastPublishedOn",
    "entryCreatedBy",
    "entrySavedBy",
    "entryModifiedBy",
    "entryFirstPublishedBy",
    "entryLastPublishedBy"
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
    entryCreatedOn: string;
    entrySavedOn: string;
    entryModifiedOn: string | null;
    entryFirstPublishedOn: string | null;
    entryLastPublishedOn: string | null;
    entryCreatedBy: CmsIdentity;
    entrySavedBy: CmsIdentity;
    entryModifiedBy: CmsIdentity | null;
    entryFirstPublishedBy: CmsIdentity | null;
    entryLastPublishedBy: CmsIdentity | null;
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
