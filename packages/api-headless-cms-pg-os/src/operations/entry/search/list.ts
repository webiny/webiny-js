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
import { configurations } from "@webiny/api-headless-cms-utils-os/configurations.js";
import type { CmsIndexEntry } from "@webiny/api-headless-cms-utils-os/types.js";
import type { SearchOperationDeps } from "./types.js";

export const createListOperation = (deps: SearchOperationDeps) => {
    return async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        listParams: CmsEntryStorageOperationsListParams
    ): Promise<CmsEntryStorageOperationsListResponse<CmsEntry<T>>> => {
        const model = deps.getStorageOperationsModel<T>(initialModel);
        const limit = createLimit(listParams.limit);

        const { index } = configurations.es({ model });

        const body = deps.bodyBuilder.build({
            model,
            params: {
                ...listParams,
                limit,
                after: decodeCursor(listParams.after)
            }
        });

        let response: OpenSearchSearchResponse;
        try {
            response = await deps.elasticsearch.search({ index, body });
        } catch (error) {
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

        // @ts-expect-error - `sort` is present on the hit, but narrowed away by `_source: false` typing.
        const cursor = items.length > 0 ? encodeCursor(hits[items.length - 1].sort) || null : null;

        return {
            hasMoreItems,
            totalCount: getTotalCount(total),
            cursor,
            items
        };
    };
};
