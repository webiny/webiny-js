import type { Knex } from "knex";
import type {
    CmsEntryStorageOperationsUnpublishParams,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import { UnpublishEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/UnpublishEntryStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import type { IEntryRow } from "./types.js";
import { entryToRow } from "./mappers.js";
import { createModelEntryQuery, syncEntryToLatest } from "./queryHelpers.js";

class SqlUnpublishEntryImpl implements UnpublishEntryStorageOperation.Interface {
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
        params: CmsEntryStorageOperationsUnpublishParams<T>
    ) {
        const tenant = this.scopeTenant.getId(
            model.tenant,
            params.entry.tenant,
            params.storageEntry.tenant
        );

        await this.entryTableManager.ensureTable();

        const existing = await this.modelQuery(tenant, model)
            .andWhere("id", params.storageEntry.id)
            .first();
        const se = params.storageEntry as CmsStorageEntry;
        se.isLatest = existing?.isLatest ?? se.isLatest;
        se.isPublished = false;

        const row = entryToRow(se, tenant);
        const { isLatest: _il, ...rowWithoutIsLatest } = row;

        await this.modelQuery(tenant, model)
            .andWhere("id", params.storageEntry.id)
            .update(rowWithoutIsLatest);

        await syncEntryToLatest(
            this.knex,
            this.entryTableManager.getTableName(),
            { tenant, modelId: model.modelId },
            se,
            latest => {
                latest.live = null;
            }
        );

        return params.entry;
    }
}

export const SqlUnpublishEntry = UnpublishEntryStorageOperation.createImplementation({
    implementation: SqlUnpublishEntryImpl,
    dependencies: [KnexClient, EntryTableManager, ScopeTenant]
});
