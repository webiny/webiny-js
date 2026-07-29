import type { Knex } from "knex";
import type {
    CmsEntryStorageOperationsGetRevisionsParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { GetRevisionsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetRevisionsStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import { parseIdentifier } from "@webiny/utils";
import type { IEntryRow } from "./types.js";
import { rowToEntry } from "./mappers.js";
import { createEntryQuery } from "./queryHelpers.js";

class SqlGetRevisionsImpl implements GetRevisionsStorageOperation.Interface {
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
        params: CmsEntryStorageOperationsGetRevisionsParams
    ) {
        await this.entryTableManager.ensureTable();

        const { id: entryId } = parseIdentifier(params.id);

        const rows: IEntryRow[] = await this.query()
            .where("tenant", model.tenant)
            .andWhere("modelId", model.modelId)
            .where("entryId", entryId)
            .orderBy("version", "desc");

        return rows.map(row => rowToEntry<T>(row));
    }
}

export const SqlGetRevisions = GetRevisionsStorageOperation.createImplementation({
    implementation: SqlGetRevisionsImpl,
    dependencies: [KnexClient, EntryTableManager]
});
