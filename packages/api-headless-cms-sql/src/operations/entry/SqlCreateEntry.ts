import type { Knex } from "knex";
import type {
    CmsEntryStorageOperationsCreateParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { CreateEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/CreateEntryStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import type { IEntryRow } from "./types.js";
import { entryToRow } from "./mappers.js";
import { createEntryQuery } from "./queryHelpers.js";

class SqlCreateEntryImpl implements CreateEntryStorageOperation.Interface {
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
        params: CmsEntryStorageOperationsCreateParams<T>
    ) {
        const tenant = this.scopeTenant.getId();

        await this.entryTableManager.ensureTable();

        const storageEntry = structuredClone(params.storageEntry);
        storageEntry.isLatest = true;
        storageEntry.isPublished = storageEntry.status === "published";

        const row = entryToRow(storageEntry, tenant);
        await this.query().insert(row);

        delete storageEntry.isLatest;
        delete storageEntry.isPublished;
        return storageEntry;
    }
}

export const SqlCreateEntry = CreateEntryStorageOperation.createImplementation({
    implementation: SqlCreateEntryImpl,
    dependencies: [KnexClient, EntryTableManager, ScopeTenant]
});
