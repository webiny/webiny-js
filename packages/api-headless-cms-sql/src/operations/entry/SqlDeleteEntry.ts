import type { Knex } from "knex";
import type {
    CmsEntryStorageOperationsDeleteParams,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { DeleteEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteEntryStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import { parseIdentifier } from "@webiny/utils";
import type { IEntryRow } from "./types.js";
import { createModelEntryQuery } from "./queryHelpers.js";

class SqlDeleteEntryImpl implements DeleteEntryStorageOperation.Interface {
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

    async execute(model: CmsModel, params: CmsEntryStorageOperationsDeleteParams) {
        await this.entryTableManager.ensureTable();

        const { id: entryId } = parseIdentifier(params.entry.id);

        await this.modelQuery(model).andWhere("entryId", entryId).delete();
    }
}

export const SqlDeleteEntry = DeleteEntryStorageOperation.createImplementation({
    implementation: SqlDeleteEntryImpl,
    dependencies: [KnexClient, EntryTableManager]
});
