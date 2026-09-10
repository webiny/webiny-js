import type { Knex } from "knex";
import type {
    CmsEntry,
    CmsEntryStorageOperationsGetByIdsParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { GetEntriesByIdsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetEntriesByIdsStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import type { IEntryRow } from "./types.js";
import { rowToEntry } from "./mappers.js";
import { createEntryQuery } from "./queryHelpers.js";

class SqlGetEntriesByIdsImpl implements GetEntriesByIdsStorageOperation.Interface {
    private readonly knex: Knex;

    public constructor(
        knexClient: KnexClient.Interface,
        private readonly entryTableManager: EntryTableManager.Interface
    ) {
        this.knex = knexClient.client;
    }

    private query(): Knex.QueryBuilder<IEntryRow> {
        return createEntryQuery(this.knex, this.entryTableManager.getTableName());
    }

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetByIdsParams
    ) {
        await this.entryTableManager.ensureTable();

        const idList = params.ids as string[];

        const rows: IEntryRow[] = await this.query()
            .where("tenant", model.tenant)
            .andWhere("modelId", model.modelId)
            .whereIn("id", idList);

        const entries = rows.map(row => rowToEntry(row));
        const byId = new Map(entries.map(e => [e.id, e]));

        return idList.map(id => byId.get(id)).filter(Boolean) as CmsEntry<T>[];
    }
}

export const SqlGetEntriesByIds = GetEntriesByIdsStorageOperation.createImplementation({
    implementation: SqlGetEntriesByIdsImpl,
    dependencies: [KnexClient, EntryTableManager]
});
