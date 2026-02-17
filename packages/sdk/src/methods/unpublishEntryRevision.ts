import type { CmsSdkConfig } from "../types.js";
import { Result } from "../Result.js";
import type { HttpError, GraphQLError, NetworkError } from "../errors.js";
import type { CmsEntryValues, CmsEntryData } from "./cmsTypes.js";

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
 * @param params.fields - Fields to include in response. Use "values." prefix for entry values (e.g., "values.author.name")
 * @returns Result containing the unpublished entry data or an error
 */
export async function unpublishEntryRevision<TValues extends CmsEntryValues = CmsEntryValues>(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: UnpublishEntryRevisionParams
): Promise<Result<CmsEntryData<TValues>, HttpError | GraphQLError | NetworkError>> {
    const { modelId, revisionId, fields } = params;

    const { executeGraphQL } = await import("./executeGraphQL.js");

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

    const result = await executeGraphQL(config, fetchFn, query, { modelId, revisionId, fields });

    if (result.isFail()) {
        return result;
    }

    const data = result.value;

    if (data.cms.unpublishEntryRevision.error) {
        const { GraphQLError } = await import("../errors.js");
        return Result.fail(
            new GraphQLError(
                data.cms.unpublishEntryRevision.error.message,
                data.cms.unpublishEntryRevision.error.code
            )
        );
    }

    return Result.ok(data.cms.unpublishEntryRevision.data);
}
