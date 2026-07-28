import type { CmsModelStorageOperationsCreateParams } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { configurations } from "@webiny/api-headless-cms-utils-os/configurations.js";
import { CreateModelStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/model/CreateModelStorageOperation.js";
import { CmsDdbEsModelEntity } from "~/abstractions/CmsDdbEsModelEntity.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { createKeys, createType } from "./keys.js";

class DdbEsCreateModelImpl implements CreateModelStorageOperation.Interface {
    private elasticsearch;

    constructor(
        private entity: CmsDdbEsModelEntity.Interface,
        openSearchClient: OpenSearchClient.Interface
    ) {
        this.elasticsearch = openSearchClient.use();
    }

    async execute(params: CmsModelStorageOperationsCreateParams) {
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
}

export const DdbEsCreateModel = CreateModelStorageOperation.createImplementation({
    implementation: DdbEsCreateModelImpl,
    dependencies: [CmsDdbEsModelEntity, OpenSearchClient]
});
