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
import { configurations } from "~/configurations.js";
import type { Client } from "@elastic/elasticsearch";
import type { QueryAllParams } from "@webiny/db-dynamodb/utils/query.js";
import { deleteItem, put, queryAll, get as getOne } from "@webiny/db-dynamodb";

interface PartitionKeysParams {
    tenant: string;
}

const createPartitionKey = (params: PartitionKeysParams): string => {
    const { tenant } = params;
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

export interface CreateModelsStorageOperationsParams {
    entity: Entity<any>;
    elasticsearch: Client;
}

export const createModelsStorageOperations = (
    params: CreateModelsStorageOperationsParams
): CmsModelStorageOperations => {
    const { entity, elasticsearch } = params;

    const create = async (params: CmsModelStorageOperationsCreateParams) => {
        const { model } = params;

        const { index } = configurations.es({
            model
        });

        const keys = createKeys(model);

        let error;
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
            error = ex;
        }
        /**
         * In case of DynamoDB error we need to remove the index we created.
         */
        try {
            await elasticsearch.indices.delete({
                index,
                ignore_unavailable: true
            });
        } catch (ex) {
            throw new WebinyError(
                `Could not delete elasticsearch index "${index}" after model record failed to be created.`,
                "DELETE_MODEL_INDEX_ERROR",
                {
                    dynamodbError: error,
                    elasticsearchError: ex
                }
            );
        }
        throw error;
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

        const { index } = configurations.es({
            model
        });

        try {
            await deleteItem({
                entity,
                keys
            });
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
        /**
         * Always delete the model index after deleting the model.
         */
        try {
            await elasticsearch.indices.delete({
                index,
                ignore_unavailable: true
            });
        } catch (ex) {
            throw new WebinyError(
                `Could not delete elasticsearch index "${index}" after model record delete.`,
                "DELETE_MODEL_INDEX_ERROR",
                {
                    error: ex,
                    index,
                    model
                }
            );
        }

        return model;
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
