import type { Knex } from "knex";
import type {
    CmsEntryStorageOperationsUnpublishParams,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { UnpublishEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/UnpublishEntryStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import type { IEntryRow } from "./types.js";
import { entryToRow } from "./mappers.js";
import { createEntryQuery, syncEntryToLatest } from "./queryHelpers.js";

class SqlUnpublishEntryImpl implements UnpublishEntryStorageOperation.Interface {
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

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsUnpublishParams<T>
    ) {
        await this.entryTableManager.ensureTable();

        const existing = await this.query().where("id", params.storageEntry.id).first();
        const se = params.storageEntry as CmsStorageEntry;
        se.isLatest = existing?.isLatest ?? se.isLatest;
        se.isPublished = false;

        const row = entryToRow(se);
        const { isLatest: _il, ...rowWithoutIsLatest } = row;

        await this.query()
            .where("tenant", model.tenant)
            .andWhere("id", params.storageEntry.id)
            .update(rowWithoutIsLatest);

        await syncEntryToLatest(this.knex, this.entryTableManager.getTableName(), se, latest => {
            latest.live = null;
        });

        return params.entry;
    }
}

export const SqlUnpublishEntry = createImplementation({
    abstraction: UnpublishEntryStorageOperation,
    implementation: SqlUnpublishEntryImpl,
    dependencies: [KnexClient, EntryTableManager]
});
