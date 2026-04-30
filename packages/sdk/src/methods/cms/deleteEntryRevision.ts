import { Result } from "../../Result.js";
import { createMethod } from "../../utils/createMethod.js";
import { deleteEntryRevisionSchema } from "./schemas.js";

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
export const deleteEntryRevision = createMethod(
    deleteEntryRevisionSchema,
    async (config, fetchFn, { modelId, revisionId, permanent = false }) => {
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

        const result = await executeGraphQL(config, fetchFn, query, {
            modelId,
            revisionId,
            permanent
        });

        if (result.isFail()) {
            return result;
        }

        const data = result.value;

        if (data.cms.deleteEntryRevision.error) {
            const { ApiError } = await import("../../errors.js");
            return Result.fail(
                new ApiError(
                    data.cms.deleteEntryRevision.error.message,
                    data.cms.deleteEntryRevision.error.code
                )
            );
        }

        return Result.ok(data.cms.deleteEntryRevision.data as boolean);
    }
);
