import type { Knex } from "knex";
import type { CmsEntry, CmsStorageEntry } from "@webiny/api-headless-cms/types/index.js";
import { mergeEntryLevelMeta } from "@webiny/api-headless-cms-sql/operations/entry/mappers.js";
import type { IEntryRow } from "./entryRow.js";

export interface IModelRef {
    tenant: string;
    modelId: string;
}

export const modelRows = (
    db: Knex,
    table: string,
    model: IModelRef
): Knex.QueryBuilder<IEntryRow> => {
    return db<IEntryRow>(table).where({ tenant: model.tenant, model_id: model.modelId });
};

/**
 * Copies entry-level meta (savedOn, modifiedBy, ...) from a non-latest revision onto the latest one,
 * the same as the SQL storage does.
 */
export const syncEntryToLatest = async (
    db: Knex,
    table: string,
    model: IModelRef,
    entry: CmsStorageEntry,
    extraPatch?: (latest: CmsEntry) => void
): Promise<void> => {
    if (entry.isLatest) {
        return;
    }
    const latestRow = await modelRows(db, table, model)
        .andWhere({ entry_id: entry.entryId, is_latest: true })
        .first();
    if (!latestRow) {
        return;
    }
    const merged = mergeEntryLevelMeta(entry, latestRow.data as unknown as CmsEntry);
    if (extraPatch) {
        extraPatch(merged);
    }
    await modelRows(db, table, model)
        .andWhere("id", latestRow.id)
        .update({ data: JSON.stringify(merged) as unknown as CmsStorageEntry });
};

/* Applies a patch to the data of every revision of an entry (plus optional column updates). */
export const patchAllEntryRevisions = async (
    db: Knex,
    table: string,
    model: IModelRef,
    entryId: string,
    patch: (entry: CmsStorageEntry) => void,
    columnUpdates?: Partial<IEntryRow>
): Promise<void> => {
    const rows = await modelRows(db, table, model).andWhere("entry_id", entryId);
    for (const row of rows) {
        const data = row.data;
        patch(data);
        await modelRows(db, table, model)
            .andWhere("id", row.id)
            .update({ ...columnUpdates, data: JSON.stringify(data) as unknown as CmsStorageEntry });
    }
};

/* Copies all entry-level *On / *By fields (except createdOn/createdBy) from source onto target. */
export const copyEntryLevelMeta = (
    source: Record<string, unknown>,
    target: Record<string, unknown>
): void => {
    for (const field of Object.keys(source)) {
        if (field === "createdOn" || field === "createdBy") {
            continue;
        }
        if ((field.endsWith("On") || field.endsWith("By")) && !field.startsWith("revision")) {
            target[field] = source[field];
        }
    }
};
