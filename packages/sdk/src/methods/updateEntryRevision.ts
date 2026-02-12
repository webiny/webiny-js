import type { CmsSdkConfig } from "../types.js";

export interface UpdateEntryRevisionParams<TValues = Record<string, unknown>> {
    modelId: string;
    revisionId: string;
    data: TValues;
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
 * @returns The updated entry data
 */
export async function updateEntryRevision<TValues = Record<string, unknown>>(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: UpdateEntryRevisionParams<TValues>
): Promise<TValues> {
    const { modelId, revisionId, data, fields } = params;

    const { executeGraphQL } = await import("./executeGraphQL.js");

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

    if (result.cms.updateEntryRevision.error) {
        throw new Error(result.cms.updateEntryRevision.error.message);
    }

    return result.cms.updateEntryRevision.data;
}
