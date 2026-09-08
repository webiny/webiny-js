import type { Knex } from "knex";
import type {
    CmsEntryStorageOperationsUpdateParams,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import { UpdateRevisionStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/UpdateRevisionStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import type { IEntryRow } from "./types.js";
import { entryToRow } from "./mappers.js";
import { createModelEntryQuery } from "./queryHelpers.js";

/**
 * Same as `SqlUpdateEntry`, without syncing the revision onto the entry's latest row.
 */
class SqlUpdateRevisionImpl implements UpdateRevisionStorageOperation.Interface {
    private readonly knex: Knex;

    public constructor(
        knexClient: KnexClient.Interface,
        private readonly entryTableManager: EntryTableManager.Interface
    ) {
        this.knex = knexClient.client;
    }

    private modelQuery(model: CmsModel): Knex.QueryBuilder<IEntryRow> {
        return createModelEntryQuery(this.knex, this.entryTableManager.getTableName(), model);
    }

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsUpdateParams<T>
    ) {
        await this.entryTableManager.ensureTable();

        const existing = await this.modelQuery(model)
            .andWhere("id", params.storageEntry.id)
            .first();
        const se = params.storageEntry as CmsStorageEntry;
        se.isLatest = existing?.isLatest ?? se.isLatest;
        se.isPublished = existing?.isPublished ?? se.isPublished;

        const row = entryToRow(se);
        const { isLatest: _il, isPublished: _ip, ...rowWithoutFlags } = row;

        await this.modelQuery(model).andWhere("id", params.storageEntry.id).update(rowWithoutFlags);

        return params.entry;
    }
}

export const SqlUpdateRevision = UpdateRevisionStorageOperation.createImplementation({
    implementation: SqlUpdateRevisionImpl,
    dependencies: [KnexClient, EntryTableManager]
});
