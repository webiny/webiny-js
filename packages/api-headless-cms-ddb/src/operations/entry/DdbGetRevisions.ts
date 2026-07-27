import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetRevisionsParams
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { GetRevisionsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetRevisionsStorageOperation.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { convertFromStorageEntry } from "./storageEntryUtils.js";

class DdbGetRevisionsImpl implements GetRevisionsStorageOperation.Interface {
    constructor(
        private dataLoaders: CmsDdbDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionsParams
    ) {
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const items = await this.dataLoaders.getAllEntryRevisions<T>({
            model,
            ids: [params.id]
        });

        return items.map(item => {
            return convertFromStorageEntry<T>({
                storageEntry: item,
                model
            });
        });
    }
}

export const DdbGetRevisions = createImplementation({
    abstraction: GetRevisionsStorageOperation,
    implementation: DdbGetRevisionsImpl,
    dependencies: [CmsDdbDataLoaders, CmsStorageModelProvider]
});
