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

export interface GetEntryRevisionByIdParams {
    modelId: string;
    revisionId: string;
    fields: string[];
}

/**
 * Retrieves a single entry revision from the CMS by its revision ID.
 *
 * @template TValues - Type of the entry values object
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for retrieving the entry revision
 * @param params.modelId - The model ID of the entry to retrieve
 * @param params.revisionId - The revision ID of the entry (e.g., "123#0001")
 * @param params.fields - Fields to include in the response. Use "values." prefix for entry values (e.g., "values.author.name") or specify top-level fields like "createdOn"
 * @returns Result containing the entry revision data (or null if not found) or an error
 */
export async function getEntryRevisionById<TValues extends CmsEntryValues = CmsEntryValues>(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: GetEntryRevisionByIdParams
): Promise<Result<CmsEntryData<TValues> | null, HttpError | GraphQLError | NetworkError>> {
    const { modelId, revisionId, fields } = params;

    const { executeGraphQL } = await import("./executeGraphQL.js");

    const query = `
        query GetEntryRevisionById($modelId: ID!, $revisionId: ID!, $fields: [String!]!) {
            cms {
                getEntryRevisionById(modelId: $modelId, revisionId: $revisionId, fields: $fields) {
                    data
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const result = await executeGraphQL(config, fetchFn, query, { modelId, revisionId, fields });

    if (result.isFail()) {
        return Result.fail(result.error);
    }

    const responseData = result.value;

    if (responseData.cms.getEntryRevisionById.error) {
        const { GraphQLError } = await import("../errors.js");
        return Result.fail(
            new GraphQLError(
                responseData.cms.getEntryRevisionById.error.message,
                responseData.cms.getEntryRevisionById.error.code
            )
        );
    }

    return Result.ok(responseData.cms.getEntryRevisionById.data);
}
