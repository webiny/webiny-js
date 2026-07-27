import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetLatestRevisionParams
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { GetLatestRevisionByEntryIdStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetLatestRevisionByEntryIdStorageOperation.js";
import { CmsDdbEsDataLoaders } from "~/abstractions/CmsDdbEsDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { convertEntryKeysFromStorage } from "./transformations/convertEntryKeys.js";

class DdbEsGetLatestRevisionByEntryIdImpl
    implements GetLatestRevisionByEntryIdStorageOperation.Interface
{
    constructor(
        private dataLoaders: CmsDdbEsDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ) {
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const [entry] = await this.dataLoaders.getLatestRevisionByEntryId<T>({
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

export const DdbEsGetLatestRevisionByEntryId = createImplementation({
    abstraction: GetLatestRevisionByEntryIdStorageOperation,
    implementation: DdbEsGetLatestRevisionByEntryIdImpl,
    dependencies: [CmsDdbEsDataLoaders, CmsStorageModelProvider]
});
