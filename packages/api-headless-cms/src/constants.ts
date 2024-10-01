import { CmsIdentity } from "~/types";

export const ROOT_FOLDER = "root";

export const CMS_MODEL_SINGLETON_TAG = "singleton";

// Content entries - xOn and xBy meta fields.
export const ENTRY_META_FIELDS = [
    // Entry-level meta fields.
    "createdOn",
    "modifiedOn",
    "savedOn",
    "deletedOn",
    "restoredOn",
    "firstPublishedOn",
    "lastPublishedOn",
    "createdBy",
    "modifiedBy",
    "savedBy",
    "deletedBy",
    "restoredBy",
    "firstPublishedBy",
    "lastPublishedBy",

    // Revision-level meta fields.
    "revisionCreatedOn",
    "revisionModifiedOn",
    "revisionSavedOn",
    "revisionDeletedOn",
    "revisionRestoredOn",
    "revisionFirstPublishedOn",
    "revisionLastPublishedOn",
    "revisionCreatedBy",
    "revisionModifiedBy",
    "revisionSavedBy",
    "revisionDeletedBy",
    "revisionRestoredBy",
    "revisionFirstPublishedBy",
    "revisionLastPublishedBy"
] as const;

export type EntryMetaFieldName = (typeof ENTRY_META_FIELDS)[number];

export interface RecordWithEntryMetaFields {
    revisionCreatedOn: string;
    revisionSavedOn: string;
    revisionModifiedOn: string | null;
    revisionDeletedOn: string | null;
    revisionRestoredOn: string | null;
    revisionFirstPublishedOn: string | null;
    revisionLastPublishedOn: string | null;
    revisionCreatedBy: CmsIdentity;
    revisionSavedBy: CmsIdentity;
    revisionModifiedBy: CmsIdentity | null;
    revisionDeletedBy: CmsIdentity | null;
    revisionRestoredBy: CmsIdentity | null;
    revisionFirstPublishedBy: CmsIdentity | null;
    revisionLastPublishedBy: CmsIdentity | null;

    // Entry-level meta fields.
    createdOn: string;
    savedOn: string;
    modifiedOn: string | null;
    deletedOn: string | null;
    restoredOn: string | null;
    firstPublishedOn: string | null;
    lastPublishedOn: string | null;
    createdBy: CmsIdentity;
    savedBy: CmsIdentity;
    modifiedBy: CmsIdentity | null;
    deletedBy: CmsIdentity | null;
    restoredBy: CmsIdentity | null;
    firstPublishedBy: CmsIdentity | null;
    lastPublishedBy: CmsIdentity | null;
}

export const pickEntryMetaFields = (
    object: Partial<RecordWithEntryMetaFields>,
    filter?: (fieldName: EntryMetaFieldName | string) => boolean
) => {
    const pickedEntryMetaFields: Partial<RecordWithEntryMetaFields> = {};
    for (const entryMetaFieldName of ENTRY_META_FIELDS) {
        const fieldExists = entryMetaFieldName in object;
        if (!fieldExists) {
            object[entryMetaFieldName] = undefined;
        }

        const mustPick = !filter || filter(entryMetaFieldName);
        if (mustPick) {
            Object.assign(pickedEntryMetaFields, {
                [entryMetaFieldName]: object[entryMetaFieldName]
            });
        }
    }

    return pickedEntryMetaFields;
};

export const isNullableEntryMetaField = (fieldName: string) => {
    // Only modifiedX, publishedX, deletedX fields are nullable.
    const lcFieldName = fieldName.toLowerCase();
    return (
        lcFieldName.includes("modified") ||
        lcFieldName.includes("published") ||
        lcFieldName.includes("deleted") ||
        lcFieldName.includes("restored")
    );
};

export const isNonNullableEntryMetaField = (fieldName: string) => {
    return !isNullableEntryMetaField(fieldName);
};

export const isDateTimeEntryMetaField = (fieldName: string) => {
    // Only field ending with "On" are date/time fields.
    return fieldName.endsWith("On");
};

export const isIdentityEntryMetaField = (fieldName: string) => {
    // Only field ending with "On" are date/time fields.
    return fieldName.endsWith("By");
};

export const isRevisionEntryMetaField = (fieldName: string) => {
    return (
        ENTRY_META_FIELDS.includes(fieldName as EntryMetaFieldName) &&
        fieldName.startsWith("revision")
    );
};

export const isEntryLevelEntryMetaField = (fieldName: string) => {
    return (
        ENTRY_META_FIELDS.includes(fieldName as EntryMetaFieldName) &&
        !fieldName.startsWith("revision")
    );
};

export const isDeletedEntryMetaField = (fieldName: string) => {
    return (
        ENTRY_META_FIELDS.includes(fieldName as EntryMetaFieldName) && fieldName.includes("deleted")
    );
};

export const isRestoredEntryMetaField = (fieldName: string) => {
    return (
        ENTRY_META_FIELDS.includes(fieldName as EntryMetaFieldName) &&
        fieldName.includes("restored")
    );
};
