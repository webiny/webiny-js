import type { Knex } from "knex";
import type {
    CmsEntryStorageOperationsDeleteEntriesParams,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { DeleteMultipleEntriesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteMultipleEntriesStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import { parseIdentifier } from "@webiny/utils";
import type { IEntryRow } from "./types.js";
import { createEntryQuery } from "./queryHelpers.js";

class SqlDeleteMultipleEntriesImpl implements DeleteMultipleEntriesStorageOperation.Interface {
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

    async execute(model: CmsModel, params: CmsEntryStorageOperationsDeleteEntriesParams) {
        await this.entryTableManager.ensureTable();

        const entryIds = params.entries.map(id => parseIdentifier(id).id);

        await this.query().where("tenant", model.tenant).whereIn("entryId", entryIds).delete();
    }
}

export const SqlDeleteMultipleEntries = DeleteMultipleEntriesStorageOperation.createImplementation({
    implementation: SqlDeleteMultipleEntriesImpl,
    dependencies: [KnexClient, EntryTableManager]
});
