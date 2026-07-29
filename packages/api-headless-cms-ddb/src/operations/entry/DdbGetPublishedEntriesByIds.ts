import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetPublishedByIdsParams
} from "@webiny/api-headless-cms/types/index.js";
import { GetPublishedEntriesByIdsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetPublishedEntriesByIdsStorageOperation.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { convertFromStorageEntry } from "./storageEntryUtils.js";

class DdbGetPublishedEntriesByIdsImpl
    implements GetPublishedEntriesByIdsStorageOperation.Interface
{
    constructor(
        private dataLoaders: CmsDdbDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedByIdsParams
    ) {
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const items = await this.dataLoaders.getPublishedRevisionByEntryId<T>({
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

export const DdbGetPublishedEntriesByIds =
    GetPublishedEntriesByIdsStorageOperation.createImplementation({
        implementation: DdbGetPublishedEntriesByIdsImpl,
        dependencies: [CmsDdbDataLoaders, CmsStorageModelProvider]
    });
