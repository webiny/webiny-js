/* SQL row representation of a CMS entry. */
export interface IEntryRow {
    id: string;
    entryId: string;
    version: number;
    status: string;
    locked: boolean;

    /* Tenant. */
    tenant: string;

    /* Flags. */
    isLatest: boolean;
    isPublished: boolean;

    /* Location. */
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

    /* Revision-level identity fields. */
    revisionCreatedBy_id: string | null;
    revisionCreatedBy_displayName: string | null;
    revisionCreatedBy_type: string | null;
    revisionCreatedBy: string | null;

    revisionModifiedBy_id: string | null;
    revisionModifiedBy: string | null;

    revisionSavedBy_id: string | null;
    revisionSavedBy: string | null;

    revisionDeletedBy_id: string | null;
    revisionDeletedBy: string | null;

    revisionRestoredBy_id: string | null;
    revisionRestoredBy: string | null;

    revisionFirstPublishedBy_id: string | null;
    revisionFirstPublishedBy: string | null;

    revisionLastPublishedBy_id: string | null;
    revisionLastPublishedBy: string | null;

    /* Entry-level date fields. */
    createdOn: string | null;
    modifiedOn: string | null;
    savedOn: string | null;
    deletedOn: string | null;
    restoredOn: string | null;
    firstPublishedOn: string | null;
    lastPublishedOn: string | null;

    /* Entry-level identity fields. */
    createdBy_id: string | null;
    createdBy_displayName: string | null;
    createdBy_type: string | null;
    createdBy: string | null;

    modifiedBy_id: string | null;
    modifiedBy: string | null;

    savedBy_id: string | null;
    savedBy: string | null;

    deletedBy_id: string | null;
    deletedBy: string | null;

    restoredBy_id: string | null;
    restoredBy: string | null;

    firstPublishedBy_id: string | null;
    firstPublishedBy: string | null;

    lastPublishedBy_id: string | null;
    lastPublishedBy: string | null;

    /* Misc meta columns. */
    wbyDeleted: boolean;
    binOriginalFolderId: string | null;
    meta: string | null;
    system: string | null;
    live: string | null;
    revisionDescription: string | null;
    expiresAt: number | null;

    /* Dynamic value columns. */
    [key: string]: unknown;
}

/* Set of all meta column names (everything in IEntryRow except the index signature). */
export const ENTRY_META_COLUMNS: Set<string> = new Set([
    "id",
    "entryId",
    "version",
    "status",
    "locked",
    "tenant",
    "isLatest",
    "isPublished",
    "location",
    "location_folderId",
    "revisionCreatedOn",
    "revisionModifiedOn",
    "revisionSavedOn",
    "revisionDeletedOn",
    "revisionRestoredOn",
    "revisionFirstPublishedOn",
    "revisionLastPublishedOn",
    "revisionCreatedBy_id",
    "revisionCreatedBy_displayName",
    "revisionCreatedBy_type",
    "revisionCreatedBy",
    "revisionModifiedBy_id",
    "revisionModifiedBy",
    "revisionSavedBy_id",
    "revisionSavedBy",
    "revisionDeletedBy_id",
    "revisionDeletedBy",
    "revisionRestoredBy_id",
    "revisionRestoredBy",
    "revisionFirstPublishedBy_id",
    "revisionFirstPublishedBy",
    "revisionLastPublishedBy_id",
    "revisionLastPublishedBy",
    "createdOn",
    "modifiedOn",
    "savedOn",
    "deletedOn",
    "restoredOn",
    "firstPublishedOn",
    "lastPublishedOn",
    "createdBy_id",
    "createdBy_displayName",
    "createdBy_type",
    "createdBy",
    "modifiedBy_id",
    "modifiedBy",
    "savedBy_id",
    "savedBy",
    "deletedBy_id",
    "deletedBy",
    "restoredBy_id",
    "restoredBy",
    "firstPublishedBy_id",
    "firstPublishedBy",
    "lastPublishedBy_id",
    "lastPublishedBy",
    "wbyDeleted",
    "binOriginalFolderId",
    "meta",
    "system",
    "live",
    "revisionDescription",
    "expiresAt"
]);

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
    "modifiedBy_id",
    "modifiedBy",
    "savedBy_id",
    "savedBy",
    "deletedBy_id",
    "deletedBy",
    "restoredBy_id",
    "restoredBy",
    "firstPublishedBy_id",
    "firstPublishedBy",
    "lastPublishedBy_id",
    "lastPublishedBy"
] as const;
