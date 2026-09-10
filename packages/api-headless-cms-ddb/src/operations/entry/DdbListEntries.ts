import WebinyError from "@webiny/error";
import type {
    CmsEntry,
    CmsEntryListWhere,
    CmsEntryStorageOperationsListParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { ListEntriesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/ListEntriesStorageOperation.js";
import { CmsDdbEntryEntity } from "~/abstractions/CmsDdbEntryEntity.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { StorageTransformRegistry } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import { createGSIPartitionKey } from "~/operations/entry/keys.js";
import { decodeCursor, encodeCursor } from "@webiny/utils";
import { ValueFilterRegistry } from "@webiny/db-utils";
import {
    createFields,
    filter,
    sort,
    createStorageTransformCallable,
    FieldFilterPathRegistry,
    FieldFilterValueTransformRegistry,
    FieldFilterCreateRegistry,
    FieldSortingRegistry
} from "@webiny/api-headless-cms-storage";
import { convertFromStorageEntry } from "./storageEntryUtils.js";

const MAX_LIST_LIMIT = 1000000;

class DdbListEntriesImpl implements ListEntriesStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEntryEntity.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private storageTransformRegistry: StorageTransformRegistry.Interface,
        private pathRegistry: FieldFilterPathRegistry.Interface,
        private transformRegistry: FieldFilterValueTransformRegistry.Interface,
        private filterCreateRegistry: FieldFilterCreateRegistry.Interface,
        private sortingRegistry: FieldSortingRegistry.Interface,
        private valueFilterRegistry: ValueFilterRegistry.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsListParams
    ) {
        const model = this.storageModelProvider.getModel(initialModel);

        const {
            limit: initialLimit = 10,
            where: initialWhere,
            after,
            sort: sortBy,
            fields,
            search
        } = params;
        const limit =
            initialLimit <= 0 || initialLimit >= MAX_LIST_LIMIT ? MAX_LIST_LIMIT : initialLimit;

        const type = initialWhere.published ? "P" : "L";

        const partitionKey = createGSIPartitionKey(model, type);
        const options = {
            index: "GSI1",
            gte: " "
        };

        let storageEntries: Awaited<ReturnType<typeof this.entity.queryAll>> = [];
        try {
            storageEntries = await this.entity.queryAll({
                partitionKey,
                options
            });
        } catch (ex) {
            throw new WebinyError(ex.message, "QUERY_ENTRIES_ERROR", {
                error: ex,
                partitionKey,
                options
            });
        }
        if (storageEntries.length === 0) {
            return {
                hasMoreItems: false,
                totalCount: 0,
                cursor: null,
                items: []
            };
        }
        const where: Partial<CmsEntryListWhere> = {
            ...initialWhere
        };
        delete where["published"];
        delete where["latest"];
        /**
         * We need an object containing field, transformers and paths.
         * Just build it here and pass on into other methods that require it to avoid mapping multiple times.
         */
        const pathRegistry = this.pathRegistry;
        const transformRegistry = this.transformRegistry;
        const filterCreateRegistry = this.filterCreateRegistry;
        const sortingRegistry = this.sortingRegistry;

        const modelFields = createFields({
            pathRegistry,
            transformRegistry,
            fields: model.fields
        });

        const fromStorage = createStorageTransformCallable(this.storageTransformRegistry, model);
        /**
         * Let's transform records from storage ones to regular ones, so we do not need to do it later.
         *
         * This is always being done, but at least its in parallel.
         */
        const records = await Promise.all(
            storageEntries.map(async storageEntry => {
                const entry = convertFromStorageEntry({
                    storageEntry: storageEntry.data,
                    model
                });

                for (const field of model.fields) {
                    entry.values[field.fieldId] = await fromStorage(
                        field,
                        entry.values[field.fieldId]
                    );
                }

                return entry as CmsEntry<T>;
            })
        );
        /* Resolve the registry once. */
        const valueFilterRegistry = this.valueFilterRegistry;

        /**
         * Filter the read items via the code.
         * It will build the filters out of the where input and transform the values it is using.
         */
        const filteredItems = filter<T>({
            items: records,
            where,
            filterCreateRegistry,
            transformRegistry,
            fields: modelFields,
            fullTextSearch: {
                term: search,
                fields: fields || []
            },
            valueFilterRegistry
        });

        const totalCount = filteredItems.length;

        /**
         * Sorting is also done via the code.
         * It takes the sort input and sorts by it via the lodash sortBy method.
         */
        const sortedItems = sort<T>({
            model,
            items: filteredItems,
            sort: sortBy,
            fields: modelFields,
            sortingRegistry
        });

        const start = parseInt((decodeCursor(after) as string) || "0") || 0;
        const hasMoreItems = totalCount > start + limit;
        const end = limit > totalCount + start + limit ? undefined : start + limit;
        const slicedItems = sortedItems.slice(start, end);
        /**
         * Although we do not need a cursor here, we will use it as such to keep it standardized.
         * Number is simply encoded.
         */
        const cursor = encodeCursor(`${start + limit}`);
        return {
            hasMoreItems,
            totalCount,
            cursor,
            items: slicedItems
        };
    }
}

export const DdbListEntries = ListEntriesStorageOperation.createImplementation({
    implementation: DdbListEntriesImpl,
    dependencies: [
        CmsDdbEntryEntity,
        CmsStorageModelProvider,
        StorageTransformRegistry,
        FieldFilterPathRegistry,
        FieldFilterValueTransformRegistry,
        FieldFilterCreateRegistry,
        FieldSortingRegistry,
        ValueFilterRegistry
    ]
});
