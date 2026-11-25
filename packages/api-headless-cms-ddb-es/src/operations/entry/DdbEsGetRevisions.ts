import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetRevisionsParams
} from "@webiny/api-headless-cms/types/index.js";
import { GetRevisionsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetRevisionsStorageOperation.js";
import { CmsDdbEsDataLoaders } from "~/abstractions/CmsDdbEsDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { convertEntryKeysFromStorage } from "./transformations/convertEntryKeys.js";

class DdbEsGetRevisionsImpl implements GetRevisionsStorageOperation.Interface {
    constructor(
        private dataLoaders: CmsDdbEsDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionsParams
    ) {
        const tenant = this.scopeTenant.getId(initialModel.tenant);
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const entries = await this.dataLoaders.getAllEntryRevisions<T>({
            model: { tenant, modelId: model.modelId },
            ids: [params.id]
        });

        return entries.map(entry => {
            return convertEntryKeysFromStorage<T>({
                model,
                entry
            });
        });
    }
}

export const DdbEsGetRevisions = GetRevisionsStorageOperation.createImplementation({
    implementation: DdbEsGetRevisionsImpl,
    dependencies: [CmsDdbEsDataLoaders, CmsStorageModelProvider, ScopeTenant]
});
