import WebinyError from "@webiny/error";
import type {
    CmsModelStorageOperations,
    CmsModelStorageOperationsCreateParams,
    CmsModelStorageOperationsDeleteParams,
    CmsModelStorageOperationsGetParams,
    CmsModelStorageOperationsListParams,
    CmsModelStorageOperationsUpdateParams
} from "@webiny/api-headless-cms/types/index.js";
import { convertException } from "@webiny/utils";
import type { IModelEntity } from "~/definitions/types.js";

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

interface CreateModelsStorageOperationsParams {
    entity: IModelEntity;
}
export const createModelsStorageOperations = (
    params: CreateModelsStorageOperationsParams
): CmsModelStorageOperations => {
    const { entity } = params;

    const create = async (params: CmsModelStorageOperationsCreateParams) => {
        const { model } = params;

        const keys = createKeys(model);

        try {
            await entity.put({
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
    };

    const update = async (params: CmsModelStorageOperationsUpdateParams) => {
        const { model } = params;

        const keys = createKeys(model);

        try {
            await entity.put({
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
    };

    const deleteModel = async (params: CmsModelStorageOperationsDeleteParams) => {
        const { model } = params;
        const keys = createKeys(model);

        try {
            await entity.delete(keys);
            return model;
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
    };

    const get = async (params: CmsModelStorageOperationsGetParams) => {
        const keys = createKeys(params);

        try {
            const result = await entity.get(keys);
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
    };

    const list = async (params: CmsModelStorageOperationsListParams) => {
        const { where } = params;

        const partitionKey = createPartitionKey(where);

        try {
            const result = await entity.queryAll({
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
    };

    return {
        create,
        update,
        delete: deleteModel,
        get,
        list
    };
};
