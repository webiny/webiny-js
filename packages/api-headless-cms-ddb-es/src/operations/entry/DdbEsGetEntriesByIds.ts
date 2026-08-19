import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetByIdsParams
} from "@webiny/api-headless-cms/types/index.js";
import { GetEntriesByIdsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetEntriesByIdsStorageOperation.js";
import { CmsDdbEsDataLoaders } from "~/abstractions/CmsDdbEsDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { convertEntryKeysFromStorage } from "./transformations/convertEntryKeys.js";

class DdbEsGetEntriesByIdsImpl implements GetEntriesByIdsStorageOperation.Interface {
    constructor(
        private dataLoaders: CmsDdbEsDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetByIdsParams
    ) {
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const entries = await this.dataLoaders.getRevisionById<T>({
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

export const DdbEsGetEntriesByIds = GetEntriesByIdsStorageOperation.createImplementation({
    implementation: DdbEsGetEntriesByIdsImpl,
    dependencies: [CmsDdbEsDataLoaders, CmsStorageModelProvider]
});
