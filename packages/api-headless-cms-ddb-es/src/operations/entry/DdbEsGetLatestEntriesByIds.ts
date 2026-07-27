import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetLatestByIdsParams
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { GetLatestEntriesByIdsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetLatestEntriesByIdsStorageOperation.js";
import { CmsDdbEsDataLoaders } from "~/abstractions/CmsDdbEsDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { convertEntryKeysFromStorage } from "./transformations/convertEntryKeys.js";

class DdbEsGetLatestEntriesByIdsImpl implements GetLatestEntriesByIdsStorageOperation.Interface {
    constructor(
        private dataLoaders: CmsDdbEsDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetLatestByIdsParams
    ) {
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const entries = await this.dataLoaders.getLatestRevisionByEntryId<T>({
            model,
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

export const DdbEsGetLatestEntriesByIds = createImplementation({
    abstraction: GetLatestEntriesByIdsStorageOperation,
    implementation: DdbEsGetLatestEntriesByIdsImpl,
    dependencies: [CmsDdbEsDataLoaders, CmsStorageModelProvider]
});
