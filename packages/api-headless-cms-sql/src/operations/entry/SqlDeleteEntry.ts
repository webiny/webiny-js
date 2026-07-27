import type { Knex } from "knex";
import type {
    CmsEntryStorageOperationsDeleteParams,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { DeleteEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteEntryStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import { parseIdentifier } from "@webiny/utils";
import type { IEntryRow } from "./types.js";
import { createEntryQuery } from "./queryHelpers.js";

class SqlDeleteEntryImpl implements DeleteEntryStorageOperation.Interface {
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

    async execute(model: CmsModel, params: CmsEntryStorageOperationsDeleteParams) {
        await this.entryTableManager.ensureTable();

        const { id: entryId } = parseIdentifier(params.entry.id);

        await this.query().where("tenant", model.tenant).andWhere("entryId", entryId).delete();
    }
}

export const SqlDeleteEntry = createImplementation({
    abstraction: DeleteEntryStorageOperation,
    implementation: SqlDeleteEntryImpl,
    dependencies: [KnexClient, EntryTableManager]
});
