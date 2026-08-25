import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetRevisionParams
} from "@webiny/api-headless-cms/types/index.js";
import { GetRevisionByIdStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetRevisionByIdStorageOperation.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { convertFromStorageEntry } from "./storageEntryUtils.js";

class DdbGetRevisionByIdImpl implements GetRevisionByIdStorageOperation.Interface {
    constructor(
        private dataLoaders: CmsDdbDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionParams
    ) {
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const [entry] = await this.dataLoaders.getRevisionById<T>({
            model,
            ids: [params.id]
        });
        if (!entry) {
            return null;
        }
        return convertFromStorageEntry<T>({ model, storageEntry: entry });
    }
}

export const DdbGetRevisionById = GetRevisionByIdStorageOperation.createImplementation({
    implementation: DdbGetRevisionByIdImpl,
    dependencies: [CmsDdbDataLoaders, CmsStorageModelProvider]
});
