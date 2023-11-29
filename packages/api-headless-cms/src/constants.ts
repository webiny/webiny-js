export const ROOT_FOLDER = "root";

// Content entries - xOn and xBy meta fields.
export const ENTRY_META_FIELDS = [
    "revisionCreatedOn",
    "revisionSavedOn",
    "revisionModifiedOn",
    "revisionCreatedBy",
    "revisionSavedBy",
    "revisionModifiedBy",
    "entryCreatedOn",
    "entrySavedOn",
    "entryModifiedOn",
    "entryCreatedBy",
    "entrySavedBy",
    "entryModifiedBy",
] as const;

export type EntryMetaField = (typeof ENTRY_META_FIELDS)[number];

export type MapEntryMetaFieldsFunction<T> = (field: EntryMetaField) => T;

export const mapEntryMetaFields = <T = unknown>(fn: MapEntryMetaFieldsFunction<T>) => {
    return ENTRY_META_FIELDS.map(field => fn(field));
};
