import type { Knex } from "knex";
import type {
    CmsEntry,
    CmsEntryStorageOperationsGetPublishedByIdsParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { GetPublishedEntriesByIdsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetPublishedEntriesByIdsStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import { parseIdentifier } from "@webiny/utils";
import type { IEntryRow } from "./types.js";
import { rowToEntry } from "./mappers.js";
import { createEntryQuery } from "./queryHelpers.js";

class SqlGetPublishedEntriesByIdsImpl
    implements GetPublishedEntriesByIdsStorageOperation.Interface
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

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedByIdsParams
    ) {
        await this.entryTableManager.ensureTable();

        const idList = params.ids as string[];
        const entryIds = idList.map(id => parseIdentifier(id).id);

        const rows: IEntryRow[] = await this.query()
            .where("tenant", model.tenant)
            .andWhere("modelId", model.modelId)
            .whereIn("entryId", entryIds)
            .andWhere("isPublished", true);

        const entries = rows.map(row => rowToEntry(row));
        const byEntryId = new Map(entries.map(e => [e.entryId, e]));

        return entryIds.map(eid => byEntryId.get(eid)).filter(Boolean) as CmsEntry<T>[];
    }
}

export const SqlGetPublishedEntriesByIds = createImplementation({
    abstraction: GetPublishedEntriesByIdsStorageOperation,
    implementation: SqlGetPublishedEntriesByIdsImpl,
    dependencies: [KnexClient, EntryTableManager]
});
