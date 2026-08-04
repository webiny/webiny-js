import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsListParams
} from "@webiny/api-headless-cms/types/index.js";
import { ListEntriesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/ListEntriesStorageOperation.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import type { Client } from "@webiny/api-opensearch";
import { createLimit, decodeCursor, encodeCursor } from "@webiny/api-opensearch";
import type { OpenSearchSearchResponse } from "@webiny/api-opensearch/types.js";
import { getTotalCount } from "@webiny/api-opensearch/types.js";
import { createConfigurations } from "@webiny/api-headless-cms-utils-os/configurations.js";
import { extractEntriesFromIndex } from "@webiny/api-headless-cms-utils-os/helpers/index.js";
import { shouldIgnoreEsResponseError } from "@webiny/api-headless-cms-utils-os/operations/entry/elasticsearch/shouldIgnoreEsResponseError.js";
import {
    CmsEntryOpenSearchBodyBuilder,
    CmsEntryOpenSearchFieldIndexRegistry,
    CmsModelOpenSearchIndexProvider
} from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import type { CmsIndexEntry } from "@webiny/api-headless-cms-utils-os/types.js";
import { convertEntryKeysFromStorage } from "./transformations/convertEntryKeys.js";

class DdbEsListEntriesImpl implements ListEntriesStorageOperation.Interface {
    private elasticsearch: Client;

    constructor(
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private bodyBuilder: CmsEntryOpenSearchBodyBuilder.Interface,
        private fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface,
        private fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface,
        openSearchClient: OpenSearchClient.Interface,
        private indexProvider: CmsModelOpenSearchIndexProvider.Interface
    ) {
        this.elasticsearch = openSearchClient.use();
    }

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsListParams
    ) {
        const model = this.storageModelProvider.getModel<T>(initialModel);

        const limit = createLimit(params.limit, 50);
        const configurations = createConfigurations(this.indexProvider);
        const { index } = await configurations.es({
            model
        });

        const body = this.bodyBuilder.build({
            model,
            params: {
                ...params,
                limit,
                after: decodeCursor(params.after)
            }
        });

        let response: OpenSearchSearchResponse;
        try {
            response = await this.elasticsearch.search({
                index,
                body
            });
        } catch (error) {
            /**
             * We will silently ignore the `index_not_found_exception` error and return an empty result set.
             * This is because the index might not exist yet, and we don't want to throw an error.
             */
            if (shouldIgnoreEsResponseError(error)) {
                return {
                    hasMoreItems: false,
                    totalCount: 0,
                    cursor: null,
                    items: []
                };
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
            fieldRegistry: this.fieldRegistry,
            fieldIndexRegistry: this.fieldIndexRegistry,
            model,
            entries: hits.map(item => {
                return item._source as CmsIndexEntry<T>;
            })
        }).map(item => {
            return convertEntryKeysFromStorage<T>({
                model,
                entry: item
            });
        });

        const hasMoreItems = items.length > limit;
        if (hasMoreItems) {
            /**
             * Remove the last item from results, we don't want to include it.
             */
            items.pop();
        }
        /**
         * Cursor is the `sort` value of the last item in the array.
         * https://www.elastic.co/guide/en/elasticsearch/reference/current/paginate-search-results.html#search-after
         */
        /**
         * TODO expect errors over hit properties is required due to opensearch library narrowing types too much because of the _source: false. At least what Claude says, didnt go into it too much.
         * Properties are there, but types are not correct.
         */
        // @ts-expect-error
        const cursor = items.length > 0 ? encodeCursor(hits[items.length - 1].sort) || null : null;
        return {
            hasMoreItems,
            totalCount: getTotalCount(total),
            cursor,
            items
        };
    }
}

export const DdbEsListEntries = ListEntriesStorageOperation.createImplementation({
    implementation: DdbEsListEntriesImpl,
    dependencies: [
        CmsStorageModelProvider,
        CmsEntryOpenSearchBodyBuilder,
        CmsModelFieldToGraphQLRegistry,
        CmsEntryOpenSearchFieldIndexRegistry,
        OpenSearchClient,
        CmsModelOpenSearchIndexProvider
    ]
});
