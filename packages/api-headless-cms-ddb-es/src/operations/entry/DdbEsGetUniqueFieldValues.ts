import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryStorageOperationsGetUniqueFieldValuesParams
} from "@webiny/api-headless-cms/types/index.js";
import { GetUniqueFieldValuesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetUniqueFieldValuesStorageOperation.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import type { Client } from "@webiny/api-opensearch";
import type {
    OpenSearchSearchResponse,
    SearchBody as OpenSearchSearchBody
} from "@webiny/api-opensearch/types.js";
import { configurations } from "@webiny/api-headless-cms-utils-os/configurations.js";
import { shouldIgnoreEsResponseError } from "@webiny/api-headless-cms-utils-os/operations/entry/elasticsearch/shouldIgnoreEsResponseError.js";
import { CmsEntryOpenSearchBodyBuilder } from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";

class DdbEsGetUniqueFieldValuesImpl implements GetUniqueFieldValuesStorageOperation.Interface {
    private elasticsearch: Client;

    constructor(
        private bodyBuilder: CmsEntryOpenSearchBodyBuilder.Interface,
        openSearchClient: OpenSearchClient.Interface
    ) {
        this.elasticsearch = openSearchClient.use();
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetUniqueFieldValuesParams) {
        const { where, fieldId } = params;

        const { index } = configurations.es({
            model
        });

        const initialBody = this.bodyBuilder.build({
            model,
            params: {
                limit: 1,
                where
            }
        });

        const field = model.fields.find(f => f.fieldId === fieldId);
        if (!field) {
            throw new WebinyError(
                `Could not find field with given "fieldId" value.`,
                "FIELD_NOT_FOUND",
                {
                    fieldId
                }
            );
        }

        const body: OpenSearchSearchBody = {
            ...initialBody,
            /**
             * We do not need any hits returned, we only need the aggregations.
             */
            size: 0,
            aggregations: {
                getUniqueFieldValues: {
                    terms: {
                        field: `values.${field.storageId}.keyword`,
                        size: 1000000
                    }
                }
            }
        };

        let response: OpenSearchSearchResponse | undefined = undefined;

        try {
            response = await this.elasticsearch.search({
                index,
                body
            });
        } catch (error) {
            if (shouldIgnoreEsResponseError(error)) {
                return [];
            }

            throw new WebinyError(
                error.message || "Error in the Elasticsearch query.",
                error.code || "OPENSEARCH_ERROR",
                {
                    error,
                    index,
                    model,
                    body
                }
            );
        }

        const aggregations = response.body.aggregations || {};
        const agg = aggregations["getUniqueFieldValues"];
        const buckets = agg && "buckets" in agg && Array.isArray(agg.buckets) ? agg.buckets : [];
        return buckets.map((bucket: { key: string; doc_count: number }) => {
            return {
                value: bucket.key,
                count: bucket.doc_count
            };
        });
    }
}

export const DdbEsGetUniqueFieldValues = GetUniqueFieldValuesStorageOperation.createImplementation({
    implementation: DdbEsGetUniqueFieldValuesImpl,
    dependencies: [CmsEntryOpenSearchBodyBuilder, OpenSearchClient]
});
