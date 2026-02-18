import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, GraphQLError, NetworkError } from "../../errors.js";
import type { CmsEntryValues, CmsEntryStatus, CmsIdentity } from "./cmsTypes.js";

/**
 * Create entry data.
 */
export interface CreateCmsEntryData<TValues extends CmsEntryValues = CmsEntryValues> {
    id?: string;
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

    values: TValues | undefined;
}

export interface CreateEntryParams<TValues extends CmsEntryValues = CmsEntryValues> {
    modelId: string;
    data: CreateCmsEntryData<TValues>;
    fields: string[];
}

/**
 * Creates a new entry in the CMS.
 *
 * @template TValues - Type of the entry data object returned (typically contains id and entryId, or additional fields if specified)
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for creating the entry
 * @param params.modelId - The model ID for the entry
 * @param params.data - The entry data to create
 * @param params.fields - Fields to include in the response. Use "values." prefix for entry values (e.g., "values.author.name") or specify top-level fields like "createdOn"
 * @returns Result containing the created entry data or an error
 */
export async function createEntry<TValues extends CmsEntryValues = CmsEntryValues>(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: CreateEntryParams<TValues>
): Promise<Result<CreateCmsEntryData<TValues>, HttpError | GraphQLError | NetworkError>> {
    const { modelId, data, fields } = params;

    const { executeGraphQL } = await import("../executeGraphQL.js");

    const query = `
        mutation CreateEntry($modelId: ID!, $data: JSON!, $fields: [String!]!) {
            cms {
                createEntry(modelId: $modelId, data: $data, fields: $fields) {
                    data
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const result = await executeGraphQL(config, fetchFn, query, { modelId, data, fields });

    if (result.isFail()) {
        return Result.fail(result.error);
    }

    const responseData = result.value;

    if (responseData.cms.createEntry.error) {
        const { GraphQLError } = await import("../../errors.js");
        return Result.fail(
            new GraphQLError(
                responseData.cms.createEntry.error.message,
                responseData.cms.createEntry.error.code
            )
        );
    }

    return Result.ok(responseData.cms.createEntry.data);
}
