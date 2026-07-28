import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetByIdsParams
} from "@webiny/api-headless-cms/types/index.js";
import { GetEntriesByIdsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetEntriesByIdsStorageOperation.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { convertFromStorageEntry } from "./storageEntryUtils.js";

class DdbGetEntriesByIdsImpl implements GetEntriesByIdsStorageOperation.Interface {
    constructor(
        private dataLoaders: CmsDdbDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetByIdsParams
    ) {
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const items = await this.dataLoaders.getRevisionById<T>({
            model,
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
    dependencies: [CmsDdbDataLoaders, CmsStorageModelProvider]
});
