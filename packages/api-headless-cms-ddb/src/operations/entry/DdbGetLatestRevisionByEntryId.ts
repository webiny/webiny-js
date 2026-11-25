import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetLatestRevisionParams
} from "@webiny/api-headless-cms/types/index.js";
import { GetLatestRevisionByEntryIdStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetLatestRevisionByEntryIdStorageOperation.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { CmsDdbDataLoaders } from "~/abstractions/CmsDdbDataLoaders.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { convertFromStorageEntry } from "./storageEntryUtils.js";

class DdbGetLatestRevisionByEntryIdImpl
    implements GetLatestRevisionByEntryIdStorageOperation.Interface
{
    constructor(
        private dataLoaders: CmsDdbDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ) {
        const tenant = this.scopeTenant.getId(initialModel.tenant);
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const items = await this.dataLoaders.getLatestRevisionByEntryId<T>({
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

export const DdbGetLatestRevisionByEntryId =
    GetLatestRevisionByEntryIdStorageOperation.createImplementation({
        implementation: DdbGetLatestRevisionByEntryIdImpl,
        dependencies: [CmsDdbDataLoaders, CmsStorageModelProvider, ScopeTenant]
    });
