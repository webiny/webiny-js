import type { Knex } from "knex";
import type {
    CmsEntryStorageOperationsListParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { ListEntriesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/ListEntriesStorageOperation.js";
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

class SqlListEntriesImpl implements ListEntriesStorageOperation.Interface {
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
        params: CmsEntryStorageOperationsListParams
    ) {
        await this.entryTableManager.ensureTable();

        return listEntries<T>(
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
            params
        );
    }
}

export const SqlListEntries = createImplementation({
    abstraction: ListEntriesStorageOperation,
    implementation: SqlListEntriesImpl,
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
