import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetByIdsParams
} from "@webiny/api-headless-cms/types/index.js";
import { GetEntriesByIdsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetEntriesByIdsStorageOperation.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { convertFromStorageEntry } from "./storageEntryUtils.js";

class DdbGetEntriesByIdsImpl implements GetEntriesByIdsStorageOperation.Interface {
    constructor(
        private dataLoaders: CmsDdbDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetByIdsParams
    ) {
        const tenant = this.scopeTenant.getId();
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const items = await this.dataLoaders.getRevisionById<T>({
            model: { tenant, modelId: model.modelId },
            ids: params.ids
        });

        return items.map(item => {
            return convertFromStorageEntry({
                storageEntry: item,
                model
            });
        });
    }
}

export const DdbGetEntriesByIds = GetEntriesByIdsStorageOperation.createImplementation({
    implementation: DdbGetEntriesByIdsImpl,
    dependencies: [CmsDdbDataLoaders, CmsStorageModelProvider, ScopeTenant]
});
