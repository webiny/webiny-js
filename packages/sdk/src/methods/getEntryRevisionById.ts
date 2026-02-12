import type { CmsSdkConfig } from "../types.js";

export interface GetEntryRevisionByIdParams {
    modelId: string;
    revisionId: string;
    fields: string[];
}

/**
 * Retrieves a single entry revision from the CMS by its revision ID.
 * 
 * @template TValues - Type of the entry data object. Users should specify this to include all fields they're requesting (id, entryId, values, createdOn, etc.)
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for retrieving the entry revision
 * @param params.modelId - The model ID of the entry to retrieve
 * @param params.revisionId - The revision ID of the entry (e.g., "123#0001")
 * @param params.fields - Fields to include in the response. Use "values." prefix for entry values (e.g., "values.author.name") or specify top-level fields like "createdOn"
 * @returns The entry revision data or null if not found
 */
export async function getEntryRevisionById<TValues = Record<string, unknown>>(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: GetEntryRevisionByIdParams
): Promise<TValues | null> {
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

    const data = await executeGraphQL(config, fetchFn, query, { modelId, revisionId, fields });

    if (data.cms.getEntryRevisionById.error) {
        throw new Error(data.cms.getEntryRevisionById.error.message);
    }

    return data.cms.getEntryRevisionById.data;
}
