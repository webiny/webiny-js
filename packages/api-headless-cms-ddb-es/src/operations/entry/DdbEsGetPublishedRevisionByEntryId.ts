import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetPublishedRevisionParams
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { GetPublishedRevisionByEntryIdStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetPublishedRevisionByEntryIdStorageOperation.js";
import { CmsDdbEsDataLoaders } from "~/abstractions/CmsDdbEsDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { convertEntryKeysFromStorage } from "./transformations/convertEntryKeys.js";

class DdbEsGetPublishedRevisionByEntryIdImpl
    implements GetPublishedRevisionByEntryIdStorageOperation.Interface
{
    constructor(
        private dataLoaders: CmsDdbEsDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedRevisionParams
    ) {
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const [entry] = await this.dataLoaders.getPublishedRevisionByEntryId<T>({
            model,
            ids: [params.id]
        });
        if (!entry) {
            return null;
        }
        return convertEntryKeysFromStorage<T>({
            model,
            entry
        });
    }
}

export const DdbEsGetPublishedRevisionByEntryId = createImplementation({
    abstraction: GetPublishedRevisionByEntryIdStorageOperation,
    implementation: DdbEsGetPublishedRevisionByEntryIdImpl,
    dependencies: [CmsDdbEsDataLoaders, CmsStorageModelProvider]
});
