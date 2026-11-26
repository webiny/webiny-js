import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetLatestByIdsParams
} from "@webiny/api-headless-cms/types/index.js";
import { GetLatestEntriesByIdsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetLatestEntriesByIdsStorageOperation.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { convertFromStorageEntry } from "./storageEntryUtils.js";

class DdbGetLatestEntriesByIdsImpl implements GetLatestEntriesByIdsStorageOperation.Interface {
    constructor(
        private dataLoaders: CmsDdbDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetLatestByIdsParams
    ) {
        const tenant = this.scopeTenant.getId();
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const items = await this.dataLoaders.getLatestRevisionByEntryId<T>({
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

export const DdbGetLatestEntriesByIds = GetLatestEntriesByIdsStorageOperation.createImplementation({
    implementation: DdbGetLatestEntriesByIdsImpl,
    dependencies: [CmsDdbDataLoaders, CmsStorageModelProvider, ScopeTenant]
});
