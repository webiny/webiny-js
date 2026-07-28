import type { CmsModelStorageOperationsDeleteParams } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { configurations } from "@webiny/api-headless-cms-utils-os/configurations.js";
import { DeleteModelStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/model/DeleteModelStorageOperation.js";
import { CmsDdbEsModelEntity } from "~/abstractions/CmsDdbEsModelEntity.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { createKeys } from "./keys.js";

class DdbEsDeleteModelImpl implements DeleteModelStorageOperation.Interface {
    private elasticsearch;

    constructor(
        private entity: CmsDdbEsModelEntity.Interface,
        openSearchClient: OpenSearchClient.Interface
    ) {
        this.elasticsearch = openSearchClient.use();
    }

    async execute(params: CmsModelStorageOperationsDeleteParams): Promise<void> {
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
}

export const DdbEsDeleteModel = DeleteModelStorageOperation.createImplementation({
    implementation: DdbEsDeleteModelImpl,
    dependencies: [CmsDdbEsModelEntity, OpenSearchClient]
});
