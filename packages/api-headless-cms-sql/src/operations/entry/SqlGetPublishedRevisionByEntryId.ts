import type { Knex } from "knex";
import type {
    CmsEntryStorageOperationsGetPublishedRevisionParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { GetPublishedRevisionByEntryIdStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetPublishedRevisionByEntryIdStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import { parseIdentifier } from "@webiny/utils";
import type { IEntryRow } from "./types.js";
import { rowToEntry } from "./mappers.js";
import { createEntryQuery } from "./queryHelpers.js";

class SqlGetPublishedRevisionByEntryIdImpl
    implements GetPublishedRevisionByEntryIdStorageOperation.Interface
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
        params: CmsEntryStorageOperationsGetPublishedRevisionParams
    ) {
        await this.entryTableManager.ensureTable();

        const { id: entryId } = parseIdentifier(params.id);

        const row = await this.query()
            .where("tenant", model.tenant)
            .andWhere("modelId", model.modelId)
            .where("entryId", entryId)
            .andWhere("isPublished", true)
            .first();

        if (!row) {
            return null;
        }

        return rowToEntry<T>(row);
    }
}

export const SqlGetPublishedRevisionByEntryId = createImplementation({
    abstraction: GetPublishedRevisionByEntryIdStorageOperation,
    implementation: SqlGetPublishedRevisionByEntryIdImpl,
    dependencies: [KnexClient, EntryTableManager]
});
