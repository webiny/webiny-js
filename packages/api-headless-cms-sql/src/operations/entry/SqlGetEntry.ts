import type { Knex } from "knex";
import type {
    CmsEntryStorageOperationsGetParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { GetEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetEntryStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import { StorageTransformRegistry } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { ValueFilterRegistry } from "@webiny/db-utils";
import {
    FieldFilterPathRegistry,
    FieldFilterValueTransformRegistry,
    FieldFilterCreateRegistry,
    FieldSortingRegistry
} from "@webiny/api-headless-cms-storage";
import { listEntries } from "./queryHelpers.js";

class SqlGetEntryImpl implements GetEntryStorageOperation.Interface {
    private readonly knex: Knex;

    public constructor(
        knexClient: KnexClient.Interface,
        private readonly entryTableManager: EntryTableManager.Interface,
        private readonly storageTransformRegistry: StorageTransformRegistry.Interface,
        private readonly storageModelProvider: CmsStorageModelProvider.Interface,
        private readonly pathRegistry: FieldFilterPathRegistry.Interface,
        private readonly transformRegistry: FieldFilterValueTransformRegistry.Interface,
        private readonly filterCreateRegistry: FieldFilterCreateRegistry.Interface,
        private readonly sortingRegistry: FieldSortingRegistry.Interface,
        private readonly valueFilterRegistry: ValueFilterRegistry.Interface
    ) {
        this.knex = knexClient.client;
    }

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetParams
    ) {
        await this.entryTableManager.ensureTable();

        const { items } = await listEntries<T>(
            {
                knex: this.knex,
                tableName: this.entryTableManager.getTableName(),
                storageModelProvider: this.storageModelProvider,
                storageTransformRegistry: this.storageTransformRegistry,
                pathRegistry: this.pathRegistry,
                transformRegistry: this.transformRegistry,
                filterCreateRegistry: this.filterCreateRegistry,
                sortingRegistry: this.sortingRegistry,
                valueFilterRegistry: this.valueFilterRegistry
            },
            model,
            { ...params, limit: 1 }
        );

        return items.shift() || null;
    }
}

export const SqlGetEntry = GetEntryStorageOperation.createImplementation({
    implementation: SqlGetEntryImpl,
    dependencies: [
        KnexClient,
        EntryTableManager,
        StorageTransformRegistry,
        CmsStorageModelProvider,
        FieldFilterPathRegistry,
        FieldFilterValueTransformRegistry,
        FieldFilterCreateRegistry,
        FieldSortingRegistry,
        ValueFilterRegistry
    ]
});
