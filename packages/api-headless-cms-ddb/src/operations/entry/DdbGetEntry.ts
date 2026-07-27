import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetParams
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { GetEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetEntryStorageOperation.js";
import { ListEntriesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/ListEntriesStorageOperation.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";

class DdbGetEntryImpl implements GetEntryStorageOperation.Interface {
    constructor(
        private listEntries: ListEntriesStorageOperation.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetParams
    ) {
        const model = this.storageModelProvider.getModel(initialModel);

        const { items } = await this.listEntries.execute<T>(model, {
            ...params,
            limit: 1
        });
        return items.shift() || null;
    }
}

export const DdbGetEntry = createImplementation({
    abstraction: GetEntryStorageOperation,
    implementation: DdbGetEntryImpl,
    dependencies: [ListEntriesStorageOperation, CmsStorageModelProvider]
});
