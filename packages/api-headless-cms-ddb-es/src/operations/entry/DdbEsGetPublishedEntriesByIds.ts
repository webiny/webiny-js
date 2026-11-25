import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetPublishedByIdsParams
} from "@webiny/api-headless-cms/types/index.js";
import { GetPublishedEntriesByIdsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetPublishedEntriesByIdsStorageOperation.js";
import { CmsDdbEsDataLoaders } from "~/abstractions/CmsDdbEsDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { convertEntryKeysFromStorage } from "./transformations/convertEntryKeys.js";

class DdbEsGetPublishedEntriesByIdsImpl
    implements GetPublishedEntriesByIdsStorageOperation.Interface
{
    constructor(
        private dataLoaders: CmsDdbEsDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedByIdsParams
    ) {
        const tenant = this.scopeTenant.getId(initialModel.tenant);
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const entries = await this.dataLoaders.getPublishedRevisionByEntryId<T>({
            model: { tenant, modelId: model.modelId },
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

export const DdbEsGetPublishedEntriesByIds =
    GetPublishedEntriesByIdsStorageOperation.createImplementation({
        implementation: DdbEsGetPublishedEntriesByIdsImpl,
        dependencies: [CmsDdbEsDataLoaders, CmsStorageModelProvider, ScopeTenant]
    });
