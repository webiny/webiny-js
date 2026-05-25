import type {
    CmsIdentity,
    CmsModel,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import type { IEntryRow } from "./types.js";
import type { IFieldColumnEntry } from "~/utils/columnName.js";
import { buildFieldColumnMap } from "~/utils/columnName.js";

/* Field types that are stored as JSON in the database. */
const JSON_FIELD_TYPES = new Set([
    "file",
    "ref",
    "object",
    "dynamicZone",
    "json",
    "searchable-json",
    "location"
]);

/* Traverses a nested object by path segments. */
const getNestedValue = (obj: Record<string, unknown>, path: string[]): unknown => {
    let current: unknown = obj;

    for (const segment of path) {
        if (current == null || typeof current !== "object") {
            return undefined;
        }
        current = (current as Record<string, unknown>)[segment];
    }

    return current;
};

/* Sets a value in a nested object, creating intermediate objects as needed. */
const setNestedValue = (obj: Record<string, unknown>, path: string[], value: unknown): void => {
    let current = obj;

    for (let i = 0; i < path.length - 1; i++) {
        const segment = path[i];

        if (current[segment] == null || typeof current[segment] !== "object") {
            current[segment] = {};
        }

        current = current[segment] as Record<string, unknown>;
    }

    current[path[path.length - 1]] = value;
};

/* Serializes a CmsIdentity to a JSON string. */
const serializeIdentity = (identity: CmsIdentity | null | undefined): string | null => {
    if (!identity) {
        return null;
    }

    return JSON.stringify(identity);
};

/* Parses a JSON string back into a CmsIdentity. */
const parseIdentity = (json: string | null | undefined): CmsIdentity | null => {
    if (!json) {
        return null;
    }

    return JSON.parse(json) as CmsIdentity;
};

/* Returns the field column entries for the given model. */
export const getFieldColumns = (model: CmsModel): IFieldColumnEntry[] => {
    return buildFieldColumnMap(model.fields);
};

/* Maps a CmsStorageEntry to an IEntryRow for SQL insertion. */
export const entryToRow = (
    entry: CmsStorageEntry,
    fieldColumns: IFieldColumnEntry[],
    options: { isLatest: boolean; isPublished: boolean }
): IEntryRow => {
    const row: IEntryRow = {
        id: entry.id,
        entryId: entry.entryId,
        version: entry.version,
        status: entry.status,
        locked: entry.locked,

        tenant: entry.tenant,
        isLatest: options.isLatest,
        isPublished: options.isPublished,

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
        revisionCreatedBy_id: entry.revisionCreatedBy?.id ?? null,
        revisionCreatedBy_displayName: entry.revisionCreatedBy?.displayName ?? null,
        revisionCreatedBy_type: entry.revisionCreatedBy?.type ?? null,
        revisionCreatedBy: serializeIdentity(entry.revisionCreatedBy),

        revisionModifiedBy_id: entry.revisionModifiedBy?.id ?? null,
        revisionModifiedBy: serializeIdentity(entry.revisionModifiedBy),

        revisionSavedBy_id: entry.revisionSavedBy?.id ?? null,
        revisionSavedBy: serializeIdentity(entry.revisionSavedBy),

        revisionDeletedBy_id: entry.revisionDeletedBy?.id ?? null,
        revisionDeletedBy: serializeIdentity(entry.revisionDeletedBy),

        revisionRestoredBy_id: entry.revisionRestoredBy?.id ?? null,
        revisionRestoredBy: serializeIdentity(entry.revisionRestoredBy),

        revisionFirstPublishedBy_id: entry.revisionFirstPublishedBy?.id ?? null,
        revisionFirstPublishedBy: serializeIdentity(entry.revisionFirstPublishedBy),

        revisionLastPublishedBy_id: entry.revisionLastPublishedBy?.id ?? null,
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
        createdBy_id: entry.createdBy?.id ?? null,
        createdBy_displayName: entry.createdBy?.displayName ?? null,
        createdBy_type: entry.createdBy?.type ?? null,
        createdBy: serializeIdentity(entry.createdBy),

        modifiedBy_id: entry.modifiedBy?.id ?? null,
        modifiedBy: serializeIdentity(entry.modifiedBy),

        savedBy_id: entry.savedBy?.id ?? null,
        savedBy: serializeIdentity(entry.savedBy),

        deletedBy_id: entry.deletedBy?.id ?? null,
        deletedBy: serializeIdentity(entry.deletedBy),

        restoredBy_id: entry.restoredBy?.id ?? null,
        restoredBy: serializeIdentity(entry.restoredBy),

        firstPublishedBy_id: entry.firstPublishedBy?.id ?? null,
        firstPublishedBy: serializeIdentity(entry.firstPublishedBy),

        lastPublishedBy_id: entry.lastPublishedBy?.id ?? null,
        lastPublishedBy: serializeIdentity(entry.lastPublishedBy),

        /* Misc meta. */
        wbyDeleted: entry.wbyDeleted ?? false,
        binOriginalFolderId: entry.binOriginalFolderId ?? null,
        meta: entry.meta ? JSON.stringify(entry.meta) : null,
        system: entry.system ? JSON.stringify(entry.system) : null,
        live: entry.live ? JSON.stringify(entry.live) : null,
        revisionDescription: entry.revisionDescription ?? null,
        expiresAt: entry.expiresAt ?? null
    };

    /* Map value columns. */
    for (const fc of fieldColumns) {
        const value = getNestedValue(entry.values as Record<string, unknown>, fc.path);

        if (fc.type === "ref__entryId") {
            /* Extract entryId from ref value for the companion column. */
            if (value && typeof value === "object" && !Array.isArray(value)) {
                row[fc.columnName] = (value as Record<string, unknown>).entryId ?? null;
            } else {
                row[fc.columnName] = null;
            }
            continue;
        }

        if (value != null && typeof value === "object") {
            row[fc.columnName] = JSON.stringify(value);
        } else {
            row[fc.columnName] = value ?? null;
        }
    }

    return row;
};

/* Reconstructs a CmsStorageEntry from a SQL row. */
export const rowToEntry = (
    row: IEntryRow,
    model: CmsModel,
    fieldColumns: IFieldColumnEntry[]
): CmsStorageEntry => {
    const values: Record<string, unknown> = {};

    for (const fc of fieldColumns) {
        if (fc.type === "ref__entryId") {
            /* Companion column is denormalized; skip it when reconstructing entry values. */
            continue;
        }

        const rawValue = row[fc.columnName];

        let value: unknown;

        if (rawValue != null && JSON_FIELD_TYPES.has(fc.type) && typeof rawValue === "string") {
            value = JSON.parse(rawValue);
        } else {
            value = rawValue ?? null;
        }

        setNestedValue(values, fc.path, value);
    }

    const locationJson = row.location;
    const location = locationJson ? JSON.parse(locationJson as string) : undefined;

    const systemJson = row.system;
    const system = systemJson ? JSON.parse(systemJson as string) : undefined;

    const liveJson = row.live;
    const live = liveJson ? JSON.parse(liveJson as string) : null;

    const metaJson = row.meta;
    const meta = metaJson ? JSON.parse(metaJson as string) : undefined;

    return {
        tenant: row.tenant as string,
        modelId: model.modelId,
        id: row.id as string,
        entryId: row.entryId as string,
        version: row.version as number,
        status: row.status as string,
        locked: row.locked as boolean,

        /* Revision-level date fields. */
        revisionCreatedOn: (row.revisionCreatedOn as string) ?? "",
        revisionModifiedOn: (row.revisionModifiedOn as string) ?? null,
        revisionSavedOn: (row.revisionSavedOn as string) ?? "",
        revisionDeletedOn: (row.revisionDeletedOn as string) ?? null,
        revisionRestoredOn: (row.revisionRestoredOn as string) ?? null,
        revisionFirstPublishedOn: (row.revisionFirstPublishedOn as string) ?? null,
        revisionLastPublishedOn: (row.revisionLastPublishedOn as string) ?? null,

        /* Revision-level identity fields. */
        revisionCreatedBy: parseIdentity(row.revisionCreatedBy as string) ?? {
            id: "",
            displayName: "",
            type: ""
        },
        revisionModifiedBy: parseIdentity(row.revisionModifiedBy as string),
        revisionSavedBy: parseIdentity(row.revisionSavedBy as string) ?? {
            id: "",
            displayName: "",
            type: ""
        },
        revisionDeletedBy: parseIdentity(row.revisionDeletedBy as string),
        revisionRestoredBy: parseIdentity(row.revisionRestoredBy as string),
        revisionFirstPublishedBy: parseIdentity(row.revisionFirstPublishedBy as string),
        revisionLastPublishedBy: parseIdentity(row.revisionLastPublishedBy as string),

        /* Entry-level date fields. */
        createdOn: (row.createdOn as string) ?? "",
        modifiedOn: (row.modifiedOn as string) ?? null,
        savedOn: (row.savedOn as string) ?? "",
        deletedOn: (row.deletedOn as string) ?? null,
        restoredOn: (row.restoredOn as string) ?? null,
        firstPublishedOn: (row.firstPublishedOn as string) ?? null,
        lastPublishedOn: (row.lastPublishedOn as string) ?? null,

        /* Entry-level identity fields. */
        createdBy: parseIdentity(row.createdBy as string) ?? {
            id: "",
            displayName: "",
            type: ""
        },
        modifiedBy: parseIdentity(row.modifiedBy as string),
        savedBy: parseIdentity(row.savedBy as string) ?? { id: "", displayName: "", type: "" },
        deletedBy: parseIdentity(row.deletedBy as string),
        restoredBy: parseIdentity(row.restoredBy as string),
        firstPublishedBy: parseIdentity(row.firstPublishedBy as string),
        lastPublishedBy: parseIdentity(row.lastPublishedBy as string),

        values,
        location,
        wbyDeleted: row.wbyDeleted as boolean,
        binOriginalFolderId: (row.binOriginalFolderId as string) ?? undefined,
        meta,
        system,
        live,
        revisionDescription: (row.revisionDescription as string) ?? undefined,
        expiresAt: (row.expiresAt as number) ?? null
    } as CmsStorageEntry;
};
