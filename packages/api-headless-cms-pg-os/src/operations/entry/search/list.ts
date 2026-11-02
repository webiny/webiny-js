import type {
    CmsEntryValues,
    CmsModel,
    CmsEntryStorageOperationsListParams,
    CmsEntryStorageOperationsListResponse,
    CmsEntry
} from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import {
    createLimit,
    decodeCursor,
    encodeCursor,
    getTotalCount,
    type OpenSearchSearchResponse
} from "@webiny/api-opensearch";
import { shouldIgnoreEsResponseError } from "@webiny/api-headless-cms-utils-os/operations/entry/elasticsearch/shouldIgnoreEsResponseError.js";
import { extractEntriesFromIndex } from "@webiny/api-headless-cms-utils-os/helpers/entryIndexHelpers.js";
import { createConfigurations } from "@webiny/api-headless-cms-utils-os/configurations.js";
import type { CmsIndexEntry } from "@webiny/api-headless-cms-utils-os/types.js";
import type { SearchOperationDeps } from "./types.js";
import "~/debuggerNamespaces.js";

export const createListOperation = (deps: SearchOperationDeps) => {
    return async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        listParams: CmsEntryStorageOperationsListParams
    ): Promise<CmsEntryStorageOperationsListResponse<CmsEntry<T>>> => {
        const model = deps.getStorageOperationsModel<T>(initialModel);
        const limit = createLimit(listParams.limit);

        const configurations = createConfigurations(deps.indexProvider);
        const { index } = await configurations.es({ model });

        const body = deps.bodyBuilder.build({
            model,
            params: {
                ...listParams,
                limit,
                after: decodeCursor(listParams.after)
            }
        });

        let response: OpenSearchSearchResponse;
        const startedAt = Date.now();
        try {
            response = await deps.elasticsearch.search({ index, body });

            deps.debuggerService.log("cms.os.list", () => ({
                index,
                query: body,
                /**
                 * Only the response body and status. The full client response also carries
                 * `meta.connection.url` (the cluster endpoint) plus request headers.
                 */
                body: response.body,
                statusCode: response.statusCode,
                tookMs: Date.now() - startedAt
            }));
        } catch (error) {
            /**
             * Logged before the `index_not_found` check below, which swallows the error and returns
             * an empty result. That silent exit is exactly what is hard to see from the outside.
             */
            deps.debuggerService.log("cms.os.list", () => ({
                index,
                query: body,
                error,
                tookMs: Date.now() - startedAt
            }));

            if (shouldIgnoreEsResponseError(error)) {
                return { hasMoreItems: false, totalCount: 0, cursor: null, items: [] };
            }
            throw new WebinyError(error.message, error.code || "OPENSEARCH_ERROR", {
                error,
                index,
                body,
                model
            });
        }

        const { hits, total } = response.body.hits;

        const items = extractEntriesFromIndex<T>({
            fieldRegistry: deps.fieldRegistry,
            fieldIndexRegistry: deps.fieldIndexRegistry,
            model,
            entries: hits.map(item => item._source as CmsIndexEntry<T>)
        });

        const hasMoreItems = items.length > limit;
        if (hasMoreItems) {
            items.pop();
        }

        const cursor = items.length > 0 ? encodeCursor(hits[items.length - 1].sort) || null : null;

        return {
            hasMoreItems,
            totalCount: getTotalCount(total),
            cursor,
            items
        };
    };
};
