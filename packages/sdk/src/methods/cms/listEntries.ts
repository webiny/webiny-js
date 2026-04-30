import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, ApiError, NetworkError, ValidationError } from "../../errors.js";
import type { CmsEntryValues, CmsEntryData } from "./cmsTypes.js";
import { transformFieldErrors } from "../../utils/transformFieldErrors.js";
import { createMethod } from "../../utils/createMethod.js";
import { listEntriesSchema } from "./schemas.js";

export interface ListEntriesParams {
    modelId: string;
    where?: Record<string, unknown>;
    sort?: Record<string, "asc" | "desc">;
    limit?: number;
    after?: string;
    search?: string;
    fields: string[];
    preview?: boolean;
}

export interface ListEntriesResult<TValues extends CmsEntryValues = CmsEntryValues> {
    data: CmsEntryData<TValues>[];
    meta: {
        cursor: string | null;
        hasMoreItems: boolean;
        totalCount: number;
    };
}

/**
 * Lists entries from the CMS with filtering, sorting, and pagination support.
 *
 * @template TValues - Type of the entry data objects. Users should specify this to include all fields they're requesting (id, entryId, values, createdOn, etc.)
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for listing entries
 * @param params.modelId - The model ID of entries to list
 * @param params.where - Optional where conditions to filter entries
 * @param params.sort - Optional sort configuration
 * @param params.limit - Maximum number of entries to return (default: 10)
 * @param params.after - Cursor for pagination
 * @param params.search - Optional full-text search term to filter entries across searchable fields (text, longText fields with fullTextSearch enabled)
 * @param params.fields - Specific fields to return. Use "values." prefix for entry values (e.g., "values.author.name") or specify top-level fields like "createdOn"
 * @param params.preview - When true, uses preview API to access unpublished/draft content. When false (default), uses read API for published content only.
 * @returns Result containing list of entries with pagination metadata or an error
 */
const _impl = createMethod(
    listEntriesSchema,
    async (
        config,
        fetchFn,
        { modelId, where, sort, limit = 10, after, search, fields, preview }
    ) => {
        const { executeGraphQL } = await import("../executeGraphQL.js");

        const query = `
        query ListEntries(
            $modelId: ID!
            $where: JSON
            $sort: JSON
            $limit: Int
            $after: String
            $search: String
            $fields: [String!]!
            $preview: Boolean
        ) {
            cms {
                listEntries(
                    modelId: $modelId
                    where: $where
                    sort: $sort
                    limit: $limit
                    after: $after
                    search: $search
                    fields: $fields
                    preview: $preview
                ) {
                    data
                    meta {
                        cursor
                        hasMoreItems
                        totalCount
                    }
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

        const result = await executeGraphQL(config, fetchFn, query, {
            modelId,
            where,
            sort,
            limit,
            after,
            search,
            fields,
            preview
        });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const responseData = result.value;

        if (responseData.cms.listEntries.error) {
            const { ApiError } = await import("../../errors.js");
            return Result.fail(
                new ApiError(
                    transformFieldErrors(responseData.cms.listEntries.error.message, fields),
                    responseData.cms.listEntries.error.code
                )
            );
        }

        return Result.ok({
            data: responseData.cms.listEntries.data,
            meta: responseData.cms.listEntries.meta
        });
    }
);

export function listEntries<TValues extends CmsEntryValues = CmsEntryValues>(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: ListEntriesParams
): Promise<
    Result<ListEntriesResult<TValues>, HttpError | ApiError | NetworkError | ValidationError>
> {
    return _impl(config, fetchFn, params) as Promise<
        Result<ListEntriesResult<TValues>, HttpError | ApiError | NetworkError | ValidationError>
    >;
}
