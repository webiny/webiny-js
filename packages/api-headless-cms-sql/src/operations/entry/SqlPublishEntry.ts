import type { Knex } from "knex";
import type {
    CmsEntryStorageOperationsPublishParams,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { PublishEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/PublishEntryStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import type { IEntryRow } from "./types.js";
import { entryToRow } from "./mappers.js";
import { createEntryQuery, syncEntryToLatest } from "./queryHelpers.js";

class SqlPublishEntryImpl implements PublishEntryStorageOperation.Interface {
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
        params: CmsEntryStorageOperationsPublishParams<T>
    ) {
        await this.entryTableManager.ensureTable();

        const oldPublishedRows = await this.query()
            .where("tenant", model.tenant)
            .andWhere("entryId", params.entry.entryId)
            .andWhere("isPublished", true);

        for (const row of oldPublishedRows) {
            const parsed = JSON.parse(row.data);
            parsed.isPublished = false;
            parsed.status = "unpublished";

            await this.query()
                .where("id", row.id)
                .update({ isPublished: false, data: JSON.stringify(parsed) });
        }

        const existing = await this.query().where("id", params.storageEntry.id).first();
        const se = params.storageEntry as CmsStorageEntry;
        se.isLatest = existing?.isLatest ?? se.isLatest;
        se.isPublished = true;

        const row = entryToRow(se);
        const { isLatest: _il, ...rowWithoutIsLatest } = row;

        await this.query()
            .where("tenant", model.tenant)
            .andWhere("id", params.storageEntry.id)
            .update(rowWithoutIsLatest);

        const liveValue = { version: params.entry.version };
        await syncEntryToLatest(this.knex, this.entryTableManager.getTableName(), se, latest => {
            latest.live = liveValue;
        });

        return params.entry;
    }
}

export const SqlPublishEntry = createImplementation({
    abstraction: PublishEntryStorageOperation,
    implementation: SqlPublishEntryImpl,
    dependencies: [KnexClient, EntryTableManager]
});
