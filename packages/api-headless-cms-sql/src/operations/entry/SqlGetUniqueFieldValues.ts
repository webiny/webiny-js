import type { Knex } from "knex";
import type {
    CmsEntryStorageOperationsGetUniqueFieldValuesParams,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { GetUniqueFieldValuesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetUniqueFieldValuesStorageOperation.js";
import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import { StorageTransformRegistry } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { ValueFilterRegistry } from "@webiny/db-utils";
import {
    aggregateUniqueFieldValues,
    FieldFilterPathRegistry,
    FieldFilterValueTransformRegistry,
    FieldFilterCreateRegistry,
    FieldSortingRegistry
} from "@webiny/api-headless-cms-storage";
import { listEntries, MAX_LIST_LIMIT } from "./queryHelpers.js";

class SqlGetUniqueFieldValuesImpl implements GetUniqueFieldValuesStorageOperation.Interface {
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

    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetUniqueFieldValuesParams) {
        const field = model.fields.find(f => f.fieldId === params.fieldId);

        if (!field) {
            return [];
        }

        await this.entryTableManager.ensureTable();

        const { items } = await listEntries(
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
            {
                where: params.where,
                limit: MAX_LIST_LIMIT
            }
        );

        return aggregateUniqueFieldValues(items, field.fieldId);
    }
}

export const SqlGetUniqueFieldValues = GetUniqueFieldValuesStorageOperation.createImplementation({
    implementation: SqlGetUniqueFieldValuesImpl,
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
