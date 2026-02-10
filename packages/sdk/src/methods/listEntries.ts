import type { CmsSdkConfig } from "../types.js";
import type { CmsEntry } from "./getEntry.js";

export interface ListEntriesParams {
    modelId: string;
    where?: Record<string, unknown>;
    sort?: Record<string, "asc" | "desc">;
    limit?: number;
    after?: string;
    include?: string[];
    exclude?: string[];
    excludeType?: string[];
    fields?: string[];
    preview?: boolean;
}

export interface ListEntriesResult<TValues = Record<string, unknown>> {
    data: CmsEntry<TValues>[];
    meta: {
        cursor: string | null;
        hasMoreItems: boolean;
        totalCount: number;
    };
}

/**
 * Lists entries from the CMS with filtering, sorting, and pagination support.
 * 
 * @template TValues - Type of the entry values object
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for listing entries
 * @param params.modelId - The model ID of entries to list
 * @param params.where - Optional where conditions to filter entries
 * @param params.sort - Optional sort configuration
 * @param params.limit - Maximum number of entries to return (default: 10)
 * @param params.after - Cursor for pagination
 * @param params.include - Fields to include
 * @param params.exclude - Fields to exclude
 * @param params.excludeType - Field types to exclude
 * @param params.fields - Optional specific fields to return. Use "values." prefix for entry values (e.g., "values.author.name") or specify top-level fields like "createdOn"
 * @param params.preview - When true, uses preview API to access unpublished/draft content. When false (default), uses read API for published content only.
 * @returns List of entries with pagination metadata
 */
export async function listEntries<TValues = Record<string, unknown>>(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: ListEntriesParams
): Promise<ListEntriesResult<TValues>> {
    const {
        modelId,
        where,
        sort,
        limit = 10,
        after,
        include,
        exclude,
        excludeType,
        fields,
        preview
    } = params;

    const { executeGraphQL } = await import("./executeGraphQL.js");

    const query = `
        query ListEntries(
            $modelId: String!
            $where: JSON
            $sort: JSON
            $limit: Int
            $after: String
            $include: [String!]
            $exclude: [String!]
            $excludeType: [String!]
            $fields: [String!]
            $preview: Boolean
        ) {
            cms {
                listEntries(
                    modelId: $modelId
                    where: $where
                    sort: $sort
                    limit: $limit
                    after: $after
                    include: $include
                    exclude: $exclude
                    excludeType: $excludeType
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

    const data = await executeGraphQL(config, fetchFn, query, {
        modelId,
        where,
        sort,
        limit,
        after,
        include,
        exclude,
        excludeType,
        fields,
        preview
    });

    if (data.cms.listEntries.error) {
        throw new Error(data.cms.listEntries.error.message);
    }

    return {
        data: data.cms.listEntries.data,
        meta: data.cms.listEntries.meta
    };
}
