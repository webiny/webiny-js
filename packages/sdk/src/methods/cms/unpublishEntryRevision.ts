import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, ApiError, NetworkError, ValidationError } from "../../errors.js";
import type { CmsEntryValues, CmsEntryData } from "./cmsTypes.js";
import { transformFieldErrors } from "../../utils/transformFieldErrors.js";
import { createMethod } from "../../utils/createMethod.js";
import { unpublishEntryRevisionSchema } from "./schemas.js";

export interface UnpublishEntryRevisionParams {
    modelId: string;
    revisionId: string;
    fields: string[];
}

/**
 * Unpublishes an entry revision in the CMS.
 *
 * @template TValues - Type of the entry values object
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for unpublishing the entry revision
 * @param params.modelId - The model ID of the entry to unpublish
 * @param params.revisionId - The revision ID of the entry to unpublish (e.g., "123#0001")
 * @param params.fields - Fields to include in response
 * @returns Result containing the unpublished entry data or an error
 */
const _impl = createMethod(
    unpublishEntryRevisionSchema,
    async (config, fetchFn, { modelId, revisionId, fields }) => {
        const { executeGraphQL } = await import("../executeGraphQL.js");

        const query = `
        mutation UnpublishEntryRevision($modelId: ID!, $revisionId: ID!, $fields: [String!]!) {
            cms {
                unpublishEntryRevision(modelId: $modelId, revisionId: $revisionId, fields: $fields) {
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
            fields
        });

        if (result.isFail()) {
            return result;
        }

        const data = result.value;

        if (data.cms.unpublishEntryRevision.error) {
            const { ApiError } = await import("../../errors.js");
            return Result.fail(
                new ApiError(
                    transformFieldErrors(data.cms.unpublishEntryRevision.error.message, fields),
                    data.cms.unpublishEntryRevision.error.code
                )
            );
        }

        return Result.ok(data.cms.unpublishEntryRevision.data);
    }
);

export function unpublishEntryRevision<TValues extends CmsEntryValues = CmsEntryValues>(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: UnpublishEntryRevisionParams
): Promise<Result<CmsEntryData<TValues>, HttpError | ApiError | NetworkError | ValidationError>> {
    return _impl(config, fetchFn, params) as Promise<
        Result<CmsEntryData<TValues>, HttpError | ApiError | NetworkError | ValidationError>
    >;
}
