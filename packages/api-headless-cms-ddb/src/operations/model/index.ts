import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsModelStorageOperations,
    CmsModelStorageOperationsCreateParams,
    CmsModelStorageOperationsDeleteParams,
    CmsModelStorageOperationsGetParams,
    CmsModelStorageOperationsListParams,
    CmsModelStorageOperationsUpdateParams
} from "@webiny/api-headless-cms/types/index.js";
import type { Entity } from "@webiny/db-dynamodb/toolbox.js";
import { queryAll, type QueryAllParams } from "@webiny/db-dynamodb/utils/query.js";
import { deleteItem, put, get as getOne } from "@webiny/db-dynamodb";
import { convertException } from "@webiny/utils";

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
}
const createKeys = (params: PartitionKeysParams & SortKeyParams): Keys => {
    return {
        PK: createPartitionKey(params),
        SK: createSortKey(params)
    };
};

const createType = (): string => {
    return "cms.model";
};

interface CreateModelsStorageOperationsParams {
    entity: Entity<any>;
}
export const createModelsStorageOperations = (
    params: CreateModelsStorageOperationsParams
): CmsModelStorageOperations => {
    const { entity } = params;

    const create = async (params: CmsModelStorageOperationsCreateParams) => {
        const { model } = params;

        const keys = createKeys(model);

        try {
            await put({
                entity,
                item: {
                    data: model,
                    ...keys,
                    TYPE: createType()
                }
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
            await put({
                entity,
                item: {
                    data: model,
                    ...keys,
                    TYPE: createType()
                }
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
            await deleteItem({
                entity,
                keys
            });
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
            const result = await getOne<{ data: CmsModel }>({
                entity,
                keys
            });

            return result ? result.data : null;
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
        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createPartitionKey(where),
            options: {
                gte: " "
            }
        };
        try {
            const result = await queryAll<{ data: CmsModel }>(queryAllParams);
            return result ? result.map(item => item.data) : [];
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not list models.",
                ex.code || "MODEL_LIST_ERROR",
                {
                    error: ex,
                    partitionKey: queryAllParams.partitionKey
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
