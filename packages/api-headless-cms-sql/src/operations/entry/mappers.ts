import type {
    CmsEntry,
    CmsEntryValues,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import type { IEntryRow } from "./types.js";

const IMMUTABLE_FIELDS = new Set(["createdOn", "createdBy"]);

export const entryToRow = (entry: CmsStorageEntry): IEntryRow => {
    return {
        id: entry.id,
        entryId: entry.entryId,
        modelId: entry.modelId,
        tenant: entry.tenant,
        version: entry.version,
        isLatest: entry.isLatest,
        isPublished: entry.isPublished,
        wbyDeleted: entry.wbyDeleted ?? false,
        data: JSON.stringify(entry)
    };
};

export const rowToEntry = <T extends CmsEntryValues = CmsEntryValues>(
    row: IEntryRow
): CmsEntry<T> => {
    return JSON.parse(row.data) as CmsEntry<T>;
};

/*
 * Merges entry-level meta fields from source into target.
 * Syncs all *On and *By fields except immutable ones (createdOn, createdBy)
 * and revision-level ones (revisionCreatedOn, revisionModifiedBy, etc.).
 */
export const mergeEntryLevelMeta = (
    source: CmsEntry,
    target: CmsEntry
): CmsEntry => {
    const result = structuredClone(target);

    for (const field of Object.keys(source)) {
        if (IMMUTABLE_FIELDS.has(field)) {
            continue;
        }
        if ((field.endsWith("On") || field.endsWith("By")) && !field.startsWith("revision")) {
            (result as unknown as Record<string, unknown>)[field] = (source as unknown as Record<string, unknown>)[field];
        }
    }

    return result;
};
