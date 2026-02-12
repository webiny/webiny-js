import type { CmsSdkConfig } from "../types.js";

export interface UnpublishEntryRevisionParams {
    modelId: string;
    revisionId: string;
    fields: string[];
}

/**
 * Unpublishes an entry revision in the CMS.
 * 
 * @template TValues - Type of the entry data object returned. Specify fields to include via the fields parameter.
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for unpublishing the entry revision
 * @param params.modelId - The model ID of the entry to unpublish
 * @param params.revisionId - The revision ID of the entry to unpublish (e.g., "123#0001")
 * @param params.fields - Fields to include in response. Use "values." prefix for entry values (e.g., "values.author.name")
 * @returns The unpublished entry data
 */
export async function unpublishEntryRevision<TValues = Record<string, unknown>>(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: UnpublishEntryRevisionParams
): Promise<TValues> {
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

    const data = await executeGraphQL(config, fetchFn, query, { modelId, revisionId, fields });

    if (data.cms.unpublishEntryRevision.error) {
        throw new Error(data.cms.unpublishEntryRevision.error.message);
    }

    return data.cms.unpublishEntryRevision.data;
}
