/* SQL row representation of a CMS entry. */
export interface IEntryRow {
    id: string;
    entryId: string;
    modelId: string;
    tenant: string;
    version: number;
    status: string;
    locked: boolean;
    isLatest: boolean;
    isPublished: boolean;
    wbyDeleted: boolean;
    binOriginalFolderId: string | null;
    location: string | null;
    location_folderId: string | null;

    /* Revision-level date fields. */
    revisionCreatedOn: string | null;
    revisionModifiedOn: string | null;
    revisionSavedOn: string | null;
    revisionDeletedOn: string | null;
    revisionRestoredOn: string | null;
    revisionFirstPublishedOn: string | null;
    revisionLastPublishedOn: string | null;

    /* Revision-level identity fields (JSON blobs). */
    revisionCreatedBy: string | null;
    revisionModifiedBy: string | null;
    revisionSavedBy: string | null;
    revisionDeletedBy: string | null;
    revisionRestoredBy: string | null;
    revisionFirstPublishedBy: string | null;
    revisionLastPublishedBy: string | null;

    /* Entry-level date fields. */
    createdOn: string | null;
    modifiedOn: string | null;
    savedOn: string | null;
    deletedOn: string | null;
    restoredOn: string | null;
    firstPublishedOn: string | null;
    lastPublishedOn: string | null;

    /* Entry-level identity fields (JSON blobs). */
    createdBy: string | null;
    modifiedBy: string | null;
    savedBy: string | null;
    deletedBy: string | null;
    restoredBy: string | null;
    firstPublishedBy: string | null;
    lastPublishedBy: string | null;

    /* Misc meta columns. */
    meta: string | null;
    system: string | null;
    live: string | null;
    revisionDescription: string | null;
    expiresAt: number | null;

    /* Values blob (JSON). */
    values: string;
}

/* No flattened _id/_displayName/_type -- only JSON blob columns. */

/*
 * Entry-level meta fields that must be synced across all revisions of an entry.
 * Excludes createdBy and createdOn because those are immutable.
 */
export const ENTRY_LEVEL_META_FIELDS = [
    "modifiedOn",
    "savedOn",
    "deletedOn",
    "restoredOn",
    "firstPublishedOn",
    "lastPublishedOn",
    "modifiedBy",
    "savedBy",
    "deletedBy",
    "restoredBy",
    "firstPublishedBy",
    "lastPublishedBy"
] as const;
