import type { Knex } from "knex";
import type {
    CmsEntryStorageOperationsGetRevisionParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { GetRevisionByIdStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetRevisionByIdStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import type { IEntryRow } from "./types.js";
import { rowToEntry } from "./mappers.js";
import { createEntryQuery } from "./queryHelpers.js";

class SqlGetRevisionByIdImpl implements GetRevisionByIdStorageOperation.Interface {
    private readonly knex: Knex;

    public constructor(
        knexClient: KnexClient.Interface,
        private readonly entryTableManager: EntryTableManager.Interface,
        private readonly scopeTenant: ScopeTenant.Interface
    ) {
        this.knex = knexClient.client;
    }

    private query(): Knex.QueryBuilder<IEntryRow> {
        return createEntryQuery(this.knex, this.entryTableManager.getTableName());
    }

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionParams
    ) {
        const tenant = this.scopeTenant.getId(model.tenant);

        await this.entryTableManager.ensureTable();

        const row = await this.query()
            .where("tenant", tenant)
            .andWhere("modelId", model.modelId)
            .where("id", params.id)
            .first();

        if (!row) {
            return null;
        }

        return rowToEntry<T>(row);
    }
}

export const SqlGetRevisionById = GetRevisionByIdStorageOperation.createImplementation({
    implementation: SqlGetRevisionByIdImpl,
    dependencies: [KnexClient, EntryTableManager, ScopeTenant]
});
