import WebinyError from "@webiny/error";
import type { OpenSearchSearchResponse } from "@webiny/api-opensearch";
import { shouldIgnoreEsResponseError } from "@webiny/api-headless-cms-utils-os/operations/entry/elasticsearch/shouldIgnoreEsResponseError.js";
import { getOpenSearchIndexPrefix } from "@webiny/api-opensearch";
import type { SearchOperationDeps } from "./types.js";
import type { GetUniqueFieldValuesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetUniqueFieldValuesStorageOperation.js";

export const createGetUniqueFieldValuesOperation = (
    deps: SearchOperationDeps
): GetUniqueFieldValuesStorageOperation.Interface["execute"] => {
    return async (model, uniqueFieldValuesParams) => {
        const { where, fieldId } = uniqueFieldValuesParams;
        const { index: rawIndex } = await deps.indexProvider.execute({ model });
        const prefix = getOpenSearchIndexPrefix();
        const index = prefix ? prefix + rawIndex : rawIndex;

        const field = model.fields.find(f => f.fieldId === fieldId);
        if (!field) {
            return [];
        }

        const initialBody = deps.bodyBuilder.build({
            model,
            params: { limit: 1, where }
        });

        const body = {
            ...initialBody,
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

        let response: OpenSearchSearchResponse;
        try {
            response = await deps.elasticsearch.search({ index, body });
        } catch (error) {
            if (shouldIgnoreEsResponseError(error)) {
                return [];
            }
            throw new WebinyError(error.message, error.code || "OPENSEARCH_ERROR", {
                error,
                index,
                model,
                body
            });
        }

        const aggregations = response.body.aggregations || {};
        const agg = aggregations["getUniqueFieldValues"];
        const buckets = agg && "buckets" in agg && Array.isArray(agg.buckets) ? agg.buckets : [];
        return buckets.map((bucket: { key: string; doc_count: number }) => ({
            value: bucket.key,
            count: bucket.doc_count
        }));
    };
};
