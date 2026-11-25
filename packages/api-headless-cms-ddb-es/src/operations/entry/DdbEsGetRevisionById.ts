import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetRevisionParams
} from "@webiny/api-headless-cms/types/index.js";
import { GetRevisionByIdStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetRevisionByIdStorageOperation.js";
import { CmsDdbEsDataLoaders } from "~/abstractions/CmsDdbEsDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { convertEntryKeysFromStorage } from "./transformations/convertEntryKeys.js";

class DdbEsGetRevisionByIdImpl implements GetRevisionByIdStorageOperation.Interface {
    constructor(
        private dataLoaders: CmsDdbEsDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionParams
    ) {
        const tenant = this.scopeTenant.getId(initialModel.tenant);
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const [entry] = await this.dataLoaders.getRevisionById<T>({
            model: { tenant, modelId: model.modelId },
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

export const DdbEsGetRevisionById = GetRevisionByIdStorageOperation.createImplementation({
    implementation: DdbEsGetRevisionByIdImpl,
    dependencies: [CmsDdbEsDataLoaders, CmsStorageModelProvider, ScopeTenant]
});
