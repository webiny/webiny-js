import type { Knex } from "knex";
import type {
    CmsEntryStorageOperationsUpdateParams,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import { UpdateEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/UpdateEntryStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import type { IEntryRow } from "./types.js";
import { entryToRow } from "./mappers.js";
import { createModelEntryQuery, syncEntryToLatest } from "./queryHelpers.js";

class SqlUpdateEntryImpl implements UpdateEntryStorageOperation.Interface {
    private readonly knex: Knex;

    public constructor(
        knexClient: KnexClient.Interface,
        private readonly entryTableManager: EntryTableManager.Interface,
        private readonly scopeTenant: ScopeTenant.Interface
    ) {
        this.knex = knexClient.client;
    }

    private modelQuery(tenant: string, model: CmsModel): Knex.QueryBuilder<IEntryRow> {
        return createModelEntryQuery(this.knex, this.entryTableManager.getTableName(), {
            tenant,
            modelId: model.modelId
        });
    }

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsUpdateParams<T>
    ) {
        const tenant = this.scopeTenant.getId();

        await this.entryTableManager.ensureTable();

        const existing = await this.modelQuery(tenant, model)
            .andWhere("id", params.storageEntry.id)
            .first();
        const se = params.storageEntry as CmsStorageEntry;
        se.isLatest = existing?.isLatest ?? se.isLatest;
        se.isPublished = existing?.isPublished ?? se.isPublished;

        const row = entryToRow(se, tenant);
        const { isLatest: _il, isPublished: _ip, ...rowWithoutFlags } = row;

        await this.modelQuery(tenant, model)
            .andWhere("id", params.storageEntry.id)
            .update(rowWithoutFlags);

        await syncEntryToLatest(
            this.knex,
            this.entryTableManager.getTableName(),
            { tenant, modelId: model.modelId },
            se
        );

        return params.entry;
    }
}

export const SqlUpdateEntry = UpdateEntryStorageOperation.createImplementation({
    implementation: SqlUpdateEntryImpl,
    dependencies: [KnexClient, EntryTableManager, ScopeTenant]
});
