import type { Knex } from "knex";
import type {
    CmsEntryStorageOperationsUpdateParams,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import { UpdateEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/UpdateEntryStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import type { IEntryRow } from "./types.js";
import { entryToRow } from "./mappers.js";
import { createModelEntryQuery, syncEntryToLatest } from "./queryHelpers.js";

class SqlUpdateEntryImpl implements UpdateEntryStorageOperation.Interface {
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

        await syncEntryToLatest(this.knex, this.entryTableManager.getTableName(), model, se);

        return params.entry;
    }
}

export const SqlUpdateEntry = UpdateEntryStorageOperation.createImplementation({
    implementation: SqlUpdateEntryImpl,
    dependencies: [KnexClient, EntryTableManager]
});
