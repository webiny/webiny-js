import type { Knex } from "knex";
import type {
    CmsEntryStorageOperationsListParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { ListEntriesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/ListEntriesStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { StorageTransformRegistry } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { CmsEntrySystemField } from "@webiny/api-headless-cms/features/contentEntry/EntrySystemField/index.js";
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
        private readonly valueFilterRegistry: ValueFilterRegistry.Interface,
        private readonly entrySystemFields: CmsEntrySystemField.Interface[],
        private readonly scopeTenant: ScopeTenant.Interface
    ) {
        this.knex = knexClient.client;
    }

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsListParams
    ) {
        const tenant = this.scopeTenant.getId();

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
                valueFilterRegistry: this.valueFilterRegistry,
                systemFields: this.entrySystemFields.map(systemField => systemField.field)
            },
            tenant,
            model,
            params
        );
    }
}

export const SqlListEntries = ListEntriesStorageOperation.createImplementation({
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
        ValueFilterRegistry,
        [CmsEntrySystemField, { multiple: true }],
        ScopeTenant
    ]
});
