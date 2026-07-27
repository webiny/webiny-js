import type {
    CmsModelStorageOperations,
    CmsModelStorageOperationsCreateParams,
    CmsModelStorageOperationsDeleteParams,
    CmsModelStorageOperationsGetParams,
    CmsModelStorageOperationsListParams,
    CmsModelStorageOperationsUpdateParams
} from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { convertException } from "@webiny/utils";
import { createImplementation } from "@webiny/feature/api";
import { ModelStorageOperations } from "@webiny/api-headless-cms/features/shared/storageOperations/ModelStorageOperations.js";
import { CmsDdbModelEntity } from "~/abstractions/CmsDdbModelEntity.js";

interface PartitionKeysParams {
    tenant: string;
}
const createPartitionKey = (params: PartitionKeysParams): string => {
    const { tenant } = params;
    if (!tenant) {
        throw new WebinyError(`Missing tenant variable when creating model partitionKey.`);
    }
    return `T#${tenant}#CMS#CM`;
};

interface SortKeyParams {
    modelId: string;
}
const createSortKey = (params: SortKeyParams): string => {
    return params.modelId;
};

interface Keys {
    PK: string;
    SK: string;
    GSI_TENANT: string;
}
const createKeys = (params: PartitionKeysParams & SortKeyParams): Keys => {
    return {
        PK: createPartitionKey(params),
        SK: createSortKey(params),
        GSI_TENANT: params.tenant
    };
};

const createType = (): string => {
    return "cms.model";
};

class DdbModelStorageOperationsImpl implements CmsModelStorageOperations {
    constructor(private entity: CmsDdbModelEntity.Interface) {}

    public async create(params: CmsModelStorageOperationsCreateParams) {
        const { model } = params;

        const keys = createKeys(model);

        try {
            await this.entity.put({
                data: model,
                ...keys,
                TYPE: createType()
            });
            return model;
        } catch (ex) {
            throw new WebinyError(`Could not create CMS Content Model.`, "CREATE_MODEL_ERROR", {
                error: convertException(ex),
                model,
                keys
            });
        }
    }

    public async update(params: CmsModelStorageOperationsUpdateParams) {
        const { model } = params;

        const keys = createKeys(model);

        try {
            await this.entity.put({
                data: model,
                ...keys,
                TYPE: createType()
            });
            return model;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update model.",
                ex.code || "MODEL_UPDATE_ERROR",
                {
                    error: ex,
                    model,
                    keys
                }
            );
        }
    }

    public async delete(params: CmsModelStorageOperationsDeleteParams) {
        const { model } = params;
        const keys = createKeys(model);

        try {
            await this.entity.delete(keys);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete model.",
                ex.code || "MODEL_DELETE_ERROR",
                {
                    error: ex,
                    model,
                    keys
                }
            );
        }
    }

    public async get(params: CmsModelStorageOperationsGetParams) {
        const keys = createKeys(params);

        try {
            const result = await this.entity.get(keys);
            return result?.data || null;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not get model.",
                ex.code || "MODEL_GET_ERROR",
                {
                    error: ex,
                    keys
                }
            );
        }
    }

    public async list(params: CmsModelStorageOperationsListParams) {
        const { where } = params;

        const partitionKey = createPartitionKey(where);

        try {
            const result = await this.entity.queryAll({
                partitionKey,
                options: {
                    gte: " "
                }
            });
            return result.map(item => {
                return item.data;
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not list models.",
                ex.code || "MODEL_LIST_ERROR",
                {
                    error: ex,
                    partitionKey
                }
            );
        }
    }
}

export const DdbModelStorageOperations = createImplementation({
    abstraction: ModelStorageOperations,
    implementation: DdbModelStorageOperationsImpl,
    dependencies: [CmsDdbModelEntity]
});
