import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetLatestByIdsParams
} from "@webiny/api-headless-cms/types/index.js";
import { GetLatestEntriesByIdsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetLatestEntriesByIdsStorageOperation.js";
import { CmsDdbEsDataLoaders } from "~/abstractions/CmsDdbEsDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { convertEntryKeysFromStorage } from "./transformations/convertEntryKeys.js";

class DdbEsGetLatestEntriesByIdsImpl implements GetLatestEntriesByIdsStorageOperation.Interface {
    constructor(
        private dataLoaders: CmsDdbEsDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetLatestByIdsParams
    ) {
        const tenant = this.scopeTenant.getId();
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const entries = await this.dataLoaders.getLatestRevisionByEntryId<T>({
            model: { tenant, modelId: model.modelId },
            ids: params.ids
        });

        return entries.map(entry => {
            return convertEntryKeysFromStorage<T>({
                model,
                entry
            });
        });
    }
}

export const DdbEsGetLatestEntriesByIds =
    GetLatestEntriesByIdsStorageOperation.createImplementation({
        implementation: DdbEsGetLatestEntriesByIdsImpl,
        dependencies: [CmsDdbEsDataLoaders, CmsStorageModelProvider, ScopeTenant]
    });
