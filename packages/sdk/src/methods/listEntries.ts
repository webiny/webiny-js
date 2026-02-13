import type { CmsSdkConfig } from "../types.js";
import { Result } from "../Result.js";
import type { HttpError, GraphQLError, NetworkError } from "../errors.js";

/**
 * Entry values type.
 */
export interface CmsEntryValues {
    [key: string]: any;
}

/**
 * Entry status type.
 */
export type CmsEntryStatus = "published" | "unpublished" | "draft";

/**
 * CMS identity.
 */
export interface CmsIdentity {
    /**
     * ID of the user.
     */
    id: string;
    /**
     * Full name of the user.
     */
    displayName: string;
    /**
     * Type of the user (admin, user).
     */
    type: string;
}

/**
 * CMS entry data returned from queries.
 */
export interface CmsEntryData<TValues extends CmsEntryValues = CmsEntryValues> {
    id?: string;
    entryId?: string;
    status?: CmsEntryStatus;

    /**
     * Entry-level meta fields.
     */
    createdOn?: Date | string;
    modifiedOn?: Date | string | null;
    savedOn?: Date | string;
    deletedOn?: Date | string | null;
    restoredOn?: Date | string | null;
    createdBy?: CmsIdentity;
    modifiedBy?: CmsIdentity;
    savedBy?: CmsIdentity;
    deletedBy?: CmsIdentity | null;
    restoredBy?: CmsIdentity | null;
    firstPublishedOn?: Date | string;
    lastPublishedOn?: Date | string;
    firstPublishedBy?: CmsIdentity;
    lastPublishedBy?: CmsIdentity;

    /**
     * Revision-level meta fields.
     */
    revisionCreatedOn?: Date | string;
    revisionModifiedOn?: Date | string | null;
    revisionSavedOn?: Date | string;
    revisionDeletedOn?: Date | string | null;
    revisionRestoredOn?: Date | string | null;
    revisionCreatedBy?: CmsIdentity;
    revisionModifiedBy?: CmsIdentity | null;
    revisionSavedBy?: CmsIdentity;
    revisionDeletedBy?: CmsIdentity | null;
    revisionRestoredBy?: CmsIdentity | null;
    revisionFirstPublishedOn?: Date | string;
    revisionLastPublishedOn?: Date | string;
    revisionFirstPublishedBy?: CmsIdentity;
    revisionLastPublishedBy?: CmsIdentity;

    location?: {
        folderId?: string | null;
    };

    values?: TValues;
}

export interface ListEntriesParams {
    modelId: string;
    where?: Record<string, unknown>;
    sort?: Record<string, "asc" | "desc">;
    limit?: number;
    after?: string;
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
 * @param params.fields - Specific fields to return. Use "values." prefix for entry values (e.g., "values.author.name") or specify top-level fields like "createdOn"
 * @param params.preview - When true, uses preview API to access unpublished/draft content. When false (default), uses read API for published content only.
 * @returns Result containing list of entries with pagination metadata or an error
 */
export async function listEntries<TValues extends CmsEntryValues = CmsEntryValues>(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: ListEntriesParams
): Promise<Result<ListEntriesResult<TValues>, HttpError | GraphQLError | NetworkError>> {
    const { modelId, where, sort, limit = 10, after, fields, preview } = params;

    const { executeGraphQL } = await import("./executeGraphQL.js");

    const query = `
        query ListEntries(
            $modelId: ID!
            $where: JSON
            $sort: JSON
            $limit: Int
            $after: String
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
        fields,
        preview
    });

    if (result.isFail()) {
        return Result.fail(result.error);
    }

    const responseData = result.value;

    if (responseData.cms.listEntries.error) {
        const { GraphQLError } = await import("../errors.js");
        return Result.fail(
            new GraphQLError(
                responseData.cms.listEntries.error.message,
                responseData.cms.listEntries.error.code
            )
        );
    }

    return Result.ok({
        data: responseData.cms.listEntries.data,
        meta: responseData.cms.listEntries.meta
    });
}
