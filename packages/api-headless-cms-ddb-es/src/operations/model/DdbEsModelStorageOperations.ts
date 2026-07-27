import WebinyError from "@webiny/error";
import type {
    CmsModelStorageOperations,
    CmsModelStorageOperationsCreateParams,
    CmsModelStorageOperationsDeleteParams,
    CmsModelStorageOperationsGetParams,
    CmsModelStorageOperationsListParams,
    CmsModelStorageOperationsUpdateParams
} from "@webiny/api-headless-cms/types/index.js";
import { configurations } from "@webiny/api-headless-cms-utils-os/configurations.js";
import { createImplementation } from "@webiny/feature/api";
import { ModelStorageOperations } from "@webiny/api-headless-cms/features/shared/storageOperations/ModelStorageOperations.js";
import { CmsDdbEsModelEntity } from "~/abstractions/CmsDdbEsModelEntity.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";

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
    GSI_TENANT: string;
}

const createKeys = (params: PartitionKeysParams & SortKeyParams): Keys => {
    if (!params.tenant) {
        throw new Error("Missing tenant when creating model keys!");
    }
    return {
        PK: createPartitionKey(params),
        SK: createSortKey(params),
        GSI_TENANT: params.tenant
    };
};

const createType = (): string => {
    return "cms.model";
};

class DdbEsModelStorageOperationsImpl implements CmsModelStorageOperations {
    private elasticsearch;

    constructor(
        private entity: CmsDdbEsModelEntity.Interface,
        openSearchClient: OpenSearchClient.Interface
    ) {
        this.elasticsearch = openSearchClient.use();
    }

    public async create(params: CmsModelStorageOperationsCreateParams) {
        const { model } = params;

        const { index } = configurations.es({
            model
        });

        const keys = createKeys(model);

        let error;
        try {
            await this.entity.put({
                data: model,
                ...keys,
                TYPE: createType()
            });
            return model;
        } catch (ex) {
            error = ex;
        }
        try {
            await this.elasticsearch.indices.delete({
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

    public async delete(params: CmsModelStorageOperationsDeleteParams): Promise<void> {
        const { model } = params;
        const keys = createKeys(model);

        const { index } = configurations.es({
            model
        });

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
        try {
            await this.elasticsearch.indices.delete({
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
    }

    public async get(params: CmsModelStorageOperationsGetParams) {
        const keys = createKeys(params);

        try {
            const result = await this.entity.get(keys);

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
            return result ? result.map(item => item.data) : [];
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

export const DdbEsModelStorageOperations = createImplementation({
    abstraction: ModelStorageOperations,
    implementation: DdbEsModelStorageOperationsImpl,
    dependencies: [CmsDdbEsModelEntity, OpenSearchClient]
});
