export const ROOT_FOLDER = "root";

// Content entries - xOn and xBy meta fields.
export const ENTRY_META_FIELDS = [
    // Revision-level meta fields.
    "revisionCreatedOn",
    "revisionSavedOn",
    "revisionModifiedOn",
    "revisionCreatedBy",
    "revisionSavedBy",
    "revisionModifiedBy",

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
    "entryLastPublishedBy",
] as const;
