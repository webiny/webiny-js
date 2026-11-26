import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetParams
} from "@webiny/api-headless-cms/types/index.js";
import { GetEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetEntryStorageOperation.js";
import { ListEntriesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/ListEntriesStorageOperation.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";

class DdbEsGetEntryImpl implements GetEntryStorageOperation.Interface {
    constructor(
        private listEntries: ListEntriesStorageOperation.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetParams
    ) {
        /**
         * Only checked here: the listing reads with the scope's tenant itself.
         */
        this.scopeTenant.getId();
        const model = this.storageModelProvider.getModel(initialModel);

        const { items } = await this.listEntries.execute<T>(model, {
            ...params,
            limit: 1
        });
        return items.shift() || null;
    }
}

export const DdbEsGetEntry = GetEntryStorageOperation.createImplementation({
    implementation: DdbEsGetEntryImpl,
    dependencies: [ListEntriesStorageOperation, CmsStorageModelProvider, ScopeTenant]
});
