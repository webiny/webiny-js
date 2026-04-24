import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, GraphQLError, NetworkError } from "../../errors.js";

export interface DeleteEntryRevisionParams {
    modelId: string;
    revisionId: string;
    permanent?: boolean;
}

/**
 * Deletes an entry revision from the CMS.
 *
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for deleting the entry revision
 * @param params.modelId - The model ID of the entry to delete
 * @param params.revisionId - The revision ID of the entry to delete (e.g., "123#0001")
 * @param params.permanent - Whether to permanently delete the entry (default: false)
 * @returns Result containing true if deletion succeeded or an error
 */
export async function deleteEntryRevision(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: DeleteEntryRevisionParams
): Promise<Result<boolean, HttpError | GraphQLError | NetworkError>> {
    const { modelId, revisionId, permanent = false } = params;

    const { executeGraphQL } = await import("../executeGraphQL.js");

    const query = `
        mutation DeleteEntryRevision($modelId: ID!, $revisionId: ID!, $permanent: Boolean) {
            cms {
                deleteEntryRevision(modelId: $modelId, revisionId: $revisionId, permanent: $permanent) {
                    data
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const result = await executeGraphQL(config, fetchFn, query, { modelId, revisionId, permanent });

    if (result.isFail()) {
        return result;
    }

    const data = result.value;

    if (data.cms.deleteEntryRevision.error) {
        const { GraphQLError } = await import("../../errors.js");
        return Result.fail(
            new GraphQLError(
                data.cms.deleteEntryRevision.error.message,
                data.cms.deleteEntryRevision.error.code
            )
        );
    }

    return Result.ok(data.cms.deleteEntryRevision.data);
}
