import type { Knex } from "knex";
import type {
    CmsEntryStorageOperationsGetLatestRevisionParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { GetLatestRevisionByEntryIdStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetLatestRevisionByEntryIdStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import { parseIdentifier } from "@webiny/utils";
import type { IEntryRow } from "./types.js";
import { rowToEntry } from "./mappers.js";
import { createEntryQuery } from "./queryHelpers.js";

class SqlGetLatestRevisionByEntryIdImpl
    implements GetLatestRevisionByEntryIdStorageOperation.Interface
{
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
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ) {
        await this.entryTableManager.ensureTable();

        const { id: entryId } = parseIdentifier(params.id);

        const row = await this.query()
            .where("tenant", model.tenant)
            .andWhere("modelId", model.modelId)
            .where("entryId", entryId)
            .andWhere("isLatest", true)
            .first();

        if (!row) {
            return null;
        }

        return rowToEntry<T>(row);
    }
}

export const SqlGetLatestRevisionByEntryId = createImplementation({
    abstraction: GetLatestRevisionByEntryIdStorageOperation,
    implementation: SqlGetLatestRevisionByEntryIdImpl,
    dependencies: [KnexClient, EntryTableManager]
});
