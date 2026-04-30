import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, NetworkError, ValidationError } from "../../errors.js";
import type { CmsEntryValues, CmsIdentity } from "./cmsTypes.js";
import { transformFieldErrors } from "../../utils/transformFieldErrors.js";
import { createMethod } from "../../utils/createMethod.js";
import { updateEntryRevisionSchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

/**
 * Update entry revision data.
 */
export interface UpdateCmsEntryData<TValues extends CmsEntryValues = CmsEntryValues> {
    /**
     * Revision-level meta fields.
     */
    revisionCreatedOn?: Date | string | null;
    revisionModifiedOn?: Date | string | null;
    revisionSavedOn?: Date | string | null;
    revisionDeletedOn?: Date | string | null;
    revisionRestoredOn?: Date | string | null;
    revisionFirstPublishedOn?: Date | string | null;
    revisionLastPublishedOn?: Date | string | null;
    revisionModifiedBy?: CmsIdentity | null;
    revisionCreatedBy?: CmsIdentity | null;
    revisionSavedBy?: CmsIdentity | null;
    revisionDeletedBy?: CmsIdentity | null;
    revisionRestoredBy?: CmsIdentity | null;
    revisionFirstPublishedBy?: CmsIdentity | null;
    revisionLastPublishedBy?: CmsIdentity | null;

    /**
     * Entry-level meta fields.
     */
    createdOn?: Date | string | null;
    modifiedOn?: Date | string | null;
    savedOn?: Date | string | null;
    deletedOn?: Date | string | null;
    restoredOn?: Date | string | null;
    firstPublishedOn?: Date | string | null;
    lastPublishedOn?: Date | string | null;
    createdBy?: CmsIdentity | null;
    modifiedBy?: CmsIdentity | null;
    savedBy?: CmsIdentity | null;
    deletedBy?: CmsIdentity | null;
    restoredBy?: CmsIdentity | null;
    firstPublishedBy?: CmsIdentity | null;
    lastPublishedBy?: CmsIdentity | null;

    location?: {
        folderId?: string | null;
    };

    values?: Partial<TValues>;
}

export interface UpdateEntryRevisionParams<TValues extends CmsEntryValues = CmsEntryValues> {
    modelId: string;
    revisionId: string;
    data: UpdateCmsEntryData<TValues>;
    fields: string[];
}

/**1`
 * Updates an existing entry revision in the CMS.
 *
 * @template TValues - Type of the entry data object returned (typically contains id and entryId, or additional fields if specified)
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for updating the entry revision
 * @param params.modelId - The model ID for the entry
 * @param params.revisionId - The revision ID of the entry to update (e.g., "123#0001")
 * @param params.data - The updated entry data
 * @param params.fields - Fields to include in the response. Use "values." prefix for entry values (e.g., "values.author.name") or specify top-level fields like "createdOn"
 * @returns Result containing the updated entry data or an error
 */

const _impl = createMethod(
    updateEntryRevisionSchema,
    async (config, fetchFn, { modelId, revisionId, data, fields }) => {
        const query = `
        mutation UpdateEntryRevision($modelId: ID!, $revisionId: ID!, $data: JSON!, $fields: [String!]!) {
            cms {
                updateEntryRevision(modelId: $modelId, revisionId: $revisionId, data: $data, fields: $fields) {
                    data
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
            revisionId,
            data,
            fields
        });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const responseData = result.value;

        if (responseData.cms.updateEntryRevision.error) {
            return Result.fail(
                new ApiError(
                    transformFieldErrors(
                        responseData.cms.updateEntryRevision.error.message,
                        fields
                    ),
                    responseData.cms.updateEntryRevision.error.code
                )
            );
        }

        return Result.ok(responseData.cms.updateEntryRevision.data);
    }
);

export function updateEntryRevision<TValues extends CmsEntryValues = CmsEntryValues>(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: UpdateEntryRevisionParams<TValues>
): Promise<
    Result<UpdateCmsEntryData<TValues>, HttpError | ApiError | NetworkError | ValidationError>
> {
    return _impl(config, fetchFn, params) as Promise<
        Result<UpdateCmsEntryData<TValues>, HttpError | ApiError | NetworkError | ValidationError>
    >;
}
