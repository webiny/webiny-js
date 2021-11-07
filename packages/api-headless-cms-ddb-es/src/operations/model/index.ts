import {
    CmsContentModel,
    CmsContentModelStorageOperations,
    CmsContentModelStorageOperationsCreateParams,
    CmsContentModelStorageOperationsDeleteParams,
    CmsContentModelStorageOperationsGetParams,
    CmsContentModelStorageOperationsListParams,
    CmsContentModelStorageOperationsUpdateParams
} from "@webiny/api-headless-cms/types";
import { Entity } from "dynamodb-toolbox";
import configurations from "~/configurations";
import WebinyError from "@webiny/error";
import { Client } from "@elastic/elasticsearch";
import { get as getRecord } from "@webiny/db-dynamodb/utils/get";
import { cleanupItem, cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";

interface PartitionKeysParams {
    tenant: string;
    locale: string;
}
const createPartitionKey = (params: PartitionKeysParams): string => {
    const { tenant, locale } = params;
    return `T#${tenant}#L#${locale}#CMS#CM`;
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

export interface Params {
    entity: Entity<any>;
    elasticsearch: Client;
}
export const createModelsStorageOperations = (params: Params): CmsContentModelStorageOperations => {
    const { entity, elasticsearch } = params;

    const create = async (params: CmsContentModelStorageOperationsCreateParams) => {
        const { model } = params;

        const { index } = configurations.es({
            model
        });
        try {
            const { body: exists } = await elasticsearch.indices.exists({
                index
            });
            if (!exists) {
                await elasticsearch.indices.create({
                    index
                });
            }
        } catch (ex) {
            throw new WebinyError(
                "Could not create Elasticsearch indice.",
                "ELASTICSEARCH_INDICE_CREATE_ERROR",
                {
                    error: ex,
                    index,
                    model
                }
            );
        }

        const keys = createKeys(model);

        let error;
        try {
            await entity.put({
                ...model,
                ...keys,
                TYPE: createType()
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
                index
            });
        } catch (ex) {
            throw new WebinyError(
                `Could not delete elasticsearch index "${index}" after model record failed to be created.`,
                "DELETE_MODEL_INDICE_ERROR",
                {
                    dynamodbError: error,
                    elasticsearchError: ex
                }
            );
        }
        throw error;
    };

    const update = async (params: CmsContentModelStorageOperationsUpdateParams) => {
        const { original, model } = params;

        const keys = createKeys(model);

        try {
            await entity.update({
                ...model,
                ...keys,
                TYPE: createType()
            });
            return model;
        } catch (ex) {
            throw new WebinyError(
                ex.messatge || "Could not update model.",
                ex.code || "MODEL_UPDATE_ERROR",
                {
                    error: ex,
                    model,
                    original,
                    keys
                }
            );
        }
    };

    const deleteModel = async (params: CmsContentModelStorageOperationsDeleteParams) => {
        const { model } = params;
        const keys = createKeys(model);

        try {
            await entity.delete(keys);
            return model;
        } catch (ex) {
            throw new WebinyError(
                ex.messatge || "Could not delete model.",
                ex.code || "MODEL_DELETE_ERROR",
                {
                    error: ex,
                    model,
                    keys
                }
            );
        }
    };

    const get = async (params: CmsContentModelStorageOperationsGetParams) => {
        const keys = createKeys(params);

        try {
            const item = await getRecord<CmsContentModel>({
                entity,
                keys
            });
            return cleanupItem(entity, item);
        } catch (ex) {
            throw new WebinyError(
                ex.messatge || "Could not get model.",
                ex.code || "MODEL_GET_ERROR",
                {
                    error: ex,
                    keys
                }
            );
        }
    };

    const list = async (params: CmsContentModelStorageOperationsListParams) => {
        const { where } = params;
        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createPartitionKey(where),
            options: {
                gte: " "
            }
        };
        try {
            const items = await queryAll<CmsContentModel>(queryAllParams);

            return cleanupItems(entity, items);
        } catch (ex) {
            throw new WebinyError(
                ex.messatge || "Could not list models.",
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
