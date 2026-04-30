import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, ApiError, NetworkError, ValidationError } from "../../errors.js";
import type { CmsEntryValues, CmsEntryData } from "./cmsTypes.js";
import { transformFieldErrors } from "../../utils/transformFieldErrors.js";
import { createMethod } from "../../utils/createMethod.js";
import { publishEntryRevisionSchema } from "./schemas.js";

export interface PublishEntryRevisionParams {
    modelId: string;
    revisionId: string;
    fields: string[];
}

/**
 * Publishes an entry revision in the CMS.
 *
 * @template TValues - Type of the entry values object
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for publishing the entry revision
 * @param params.modelId - The model ID of the entry to publish
 * @param params.revisionId - The revision ID of the entry to publish (e.g., "123#0001")
 * @param params.fields - Fields to include in response
 * @returns Result containing the published entry data or an error
 */
const _impl = createMethod(
    publishEntryRevisionSchema,
    async (config, fetchFn, { modelId, revisionId, fields }) => {
        const { executeGraphQL } = await import("../executeGraphQL.js");

        const query = `
        mutation PublishEntryRevision($modelId: ID!, $revisionId: ID!, $fields: [String!]!) {
            cms {
                publishEntryRevision(modelId: $modelId, revisionId: $revisionId, fields: $fields) {
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
            return Result.fail(result.error);
        }

        const responseData = result.value;

        if (responseData.cms.publishEntryRevision.error) {
            const { ApiError } = await import("../../errors.js");
            return Result.fail(
                new ApiError(
                    transformFieldErrors(
                        responseData.cms.publishEntryRevision.error.message,
                        fields
                    ),
                    responseData.cms.publishEntryRevision.error.code
                )
            );
        }

        return Result.ok(responseData.cms.publishEntryRevision.data);
    }
);

export function publishEntryRevision<TValues extends CmsEntryValues = CmsEntryValues>(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: PublishEntryRevisionParams
): Promise<Result<CmsEntryData<TValues>, HttpError | ApiError | NetworkError | ValidationError>> {
    return _impl(config, fetchFn, params) as Promise<
        Result<CmsEntryData<TValues>, HttpError | ApiError | NetworkError | ValidationError>
    >;
}
