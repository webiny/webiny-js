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

export type EntryMetaField = (typeof ENTRY_META_FIELDS)[number];

/**
 * Since we're setting a different revision as the latest, we need to update the meta fields.
 * The values are taken from the latest revision we're about to delete. The update of the
 * new latest revision is performed within the storageOperations.entries.deleteRevision method.
 */
export const pickEntryMetaFields = <T>(object: T, filter?: (fieldName: string) => boolean) => {
    return ENTRY_META_FIELDS.reduce((acc, key) => {
        if (key in object) {
            const mustPick = !filter || filter(key);
            if (mustPick) {
                acc[key] = object[key];
            }
        }
        return acc;
    }, {} as Record<string, string | CmsIdentity | null>);
};


export const isNullableEntryMetaField = (field: EntryMetaField) => {
    // Only modifiedX and publishedX fields are nullable.
    return field.includes("Modified") || field.includes("Published");
};

export const isDateTimeEntryMetaField = (field: EntryMetaField) => {
    // Only field ending with "On" are date/time fields.
    return field.endsWith('On');
};
