import type {
    CmsIdentity,
    CmsModel,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import type { IEntryRow } from "./types.js";
import { ENTRY_LEVEL_META_FIELDS } from "./types.js";

/* Serializes a CmsIdentity to a JSON string. */
const serializeIdentity = (identity: CmsIdentity | null | undefined): string | null => {
    if (!identity) {
        return null;
    }

    return JSON.stringify(identity);
};

/* Parses a JSON string back into a CmsIdentity, returning a default for null. */
const parseIdentity = (json: string | null | undefined): CmsIdentity => {
    if (!json) {
        return { id: "", displayName: "", type: "" };
    }

    return JSON.parse(json) as CmsIdentity;
};

/* Parses a JSON string back into a CmsIdentity, returning null for null. */
const parseIdentityNullable = (json: string | null | undefined): CmsIdentity | null => {
    if (!json) {
        return null;
    }

    return JSON.parse(json) as CmsIdentity;
};

/* Maps a CmsStorageEntry to an IEntryRow for SQL insertion. */
export const entryToRow = (
    entry: CmsStorageEntry,
    model: CmsModel,
    options: { isLatest: boolean; isPublished: boolean }
): IEntryRow => {
    return {
        id: entry.id,
        entryId: entry.entryId,
        modelId: model.modelId,
        tenant: model.tenant,
        version: entry.version,
        status: entry.status,
        locked: entry.locked,
        isLatest: options.isLatest,
        isPublished: options.isPublished,
        wbyDeleted: entry.wbyDeleted ?? false,
        binOriginalFolderId: entry.binOriginalFolderId ?? null,

        /* Location. */
        location: entry.location ? JSON.stringify(entry.location) : null,
        location_folderId: entry.location?.folderId ?? null,

        /* Revision-level date fields. */
        revisionCreatedOn: entry.revisionCreatedOn ?? null,
        revisionModifiedOn: entry.revisionModifiedOn ?? null,
        revisionSavedOn: entry.revisionSavedOn ?? null,
        revisionDeletedOn: entry.revisionDeletedOn ?? null,
        revisionRestoredOn: entry.revisionRestoredOn ?? null,
        revisionFirstPublishedOn: entry.revisionFirstPublishedOn ?? null,
        revisionLastPublishedOn: entry.revisionLastPublishedOn ?? null,

        /* Revision-level identity fields. */
        revisionCreatedBy: serializeIdentity(entry.revisionCreatedBy),
        revisionModifiedBy: serializeIdentity(entry.revisionModifiedBy),
        revisionSavedBy: serializeIdentity(entry.revisionSavedBy),
        revisionDeletedBy: serializeIdentity(entry.revisionDeletedBy),
        revisionRestoredBy: serializeIdentity(entry.revisionRestoredBy),
        revisionFirstPublishedBy: serializeIdentity(entry.revisionFirstPublishedBy),
        revisionLastPublishedBy: serializeIdentity(entry.revisionLastPublishedBy),

        /* Entry-level date fields. */
        createdOn: entry.createdOn ?? null,
        modifiedOn: entry.modifiedOn ?? null,
        savedOn: entry.savedOn ?? null,
        deletedOn: entry.deletedOn ?? null,
        restoredOn: entry.restoredOn ?? null,
        firstPublishedOn: entry.firstPublishedOn ?? null,
        lastPublishedOn: entry.lastPublishedOn ?? null,

        /* Entry-level identity fields. */
        createdBy: serializeIdentity(entry.createdBy),
        modifiedBy: serializeIdentity(entry.modifiedBy),
        savedBy: serializeIdentity(entry.savedBy),
        deletedBy: serializeIdentity(entry.deletedBy),
        restoredBy: serializeIdentity(entry.restoredBy),
        firstPublishedBy: serializeIdentity(entry.firstPublishedBy),
        lastPublishedBy: serializeIdentity(entry.lastPublishedBy),

        /* Misc meta. */
        meta: entry.meta ? JSON.stringify(entry.meta) : null,
        system: entry.system ? JSON.stringify(entry.system) : null,
        live: entry.live ? JSON.stringify(entry.live) : null,
        revisionDescription: entry.revisionDescription ?? null,
        expiresAt: entry.expiresAt ?? null,

        /* Values blob. */
        values: JSON.stringify(entry.values ?? {})
    };
};

/* Reconstructs a CmsStorageEntry from a SQL row. */
export const rowToEntry = (row: IEntryRow): CmsStorageEntry => {
    const values = row.values ? JSON.parse(row.values) : {};
    const location = row.location ? JSON.parse(row.location) : undefined;
    const meta = row.meta ? JSON.parse(row.meta) : undefined;
    const system = row.system ? JSON.parse(row.system) : undefined;
    const live = row.live ? JSON.parse(row.live) : null;

    return {
        tenant: row.tenant,
        modelId: row.modelId,
        id: row.id,
        entryId: row.entryId,
        version: row.version,
        status: row.status,
        locked: row.locked,

        /* Revision-level date fields. */
        revisionCreatedOn: row.revisionCreatedOn ?? "",
        revisionModifiedOn: row.revisionModifiedOn ?? null,
        revisionSavedOn: row.revisionSavedOn ?? "",
        revisionDeletedOn: row.revisionDeletedOn ?? null,
        revisionRestoredOn: row.revisionRestoredOn ?? null,
        revisionFirstPublishedOn: row.revisionFirstPublishedOn ?? null,
        revisionLastPublishedOn: row.revisionLastPublishedOn ?? null,

        /* Revision-level identity fields. */
        revisionCreatedBy: parseIdentity(row.revisionCreatedBy),
        revisionModifiedBy: parseIdentityNullable(row.revisionModifiedBy),
        revisionSavedBy: parseIdentity(row.revisionSavedBy),
        revisionDeletedBy: parseIdentityNullable(row.revisionDeletedBy),
        revisionRestoredBy: parseIdentityNullable(row.revisionRestoredBy),
        revisionFirstPublishedBy: parseIdentityNullable(row.revisionFirstPublishedBy),
        revisionLastPublishedBy: parseIdentityNullable(row.revisionLastPublishedBy),

        /* Entry-level date fields. */
        createdOn: row.createdOn ?? "",
        modifiedOn: row.modifiedOn ?? null,
        savedOn: row.savedOn ?? "",
        deletedOn: row.deletedOn ?? null,
        restoredOn: row.restoredOn ?? null,
        firstPublishedOn: row.firstPublishedOn ?? null,
        lastPublishedOn: row.lastPublishedOn ?? null,

        /* Entry-level identity fields. */
        createdBy: parseIdentity(row.createdBy),
        modifiedBy: parseIdentityNullable(row.modifiedBy),
        savedBy: parseIdentity(row.savedBy),
        deletedBy: parseIdentityNullable(row.deletedBy),
        restoredBy: parseIdentityNullable(row.restoredBy),
        firstPublishedBy: parseIdentityNullable(row.firstPublishedBy),
        lastPublishedBy: parseIdentityNullable(row.lastPublishedBy),

        values,
        location,
        wbyDeleted: row.wbyDeleted,
        binOriginalFolderId: row.binOriginalFolderId ?? undefined,
        meta,
        system,
        live,
        revisionDescription: row.revisionDescription ?? undefined,
        expiresAt: row.expiresAt ?? null
    } as CmsStorageEntry;
};

/* Extracts only the entry-level meta fields from a row for propagation. */
export const getEntryLevelMeta = (row: IEntryRow): Record<string, unknown> => {
    const result: Record<string, unknown> = {};

    for (const field of ENTRY_LEVEL_META_FIELDS) {
        result[field] = row[field as keyof IEntryRow];
    }

    return result;
};
