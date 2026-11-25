import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetPublishedRevisionParams
} from "@webiny/api-headless-cms/types/index.js";
import { GetPublishedRevisionByEntryIdStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetPublishedRevisionByEntryIdStorageOperation.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { convertFromStorageEntry } from "./storageEntryUtils.js";

class DdbGetPublishedRevisionByEntryIdImpl
    implements GetPublishedRevisionByEntryIdStorageOperation.Interface
{
    constructor(
        private dataLoaders: CmsDdbDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedRevisionParams
    ) {
        const tenant = this.scopeTenant.getId(initialModel.tenant);
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const items = await this.dataLoaders.getPublishedRevisionByEntryId<T>({
            model: { tenant, modelId: model.modelId },
            ids: [params.id]
        });
        const item = items.shift() || null;
        if (!item) {
            return null;
        }
        return convertFromStorageEntry({
            storageEntry: item,
            model
        });
    }
}

export const DdbGetPublishedRevisionByEntryId =
    GetPublishedRevisionByEntryIdStorageOperation.createImplementation({
        implementation: DdbGetPublishedRevisionByEntryIdImpl,
        dependencies: [CmsDdbDataLoaders, CmsStorageModelProvider, ScopeTenant]
    });
