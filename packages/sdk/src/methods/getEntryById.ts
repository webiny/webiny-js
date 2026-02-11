import type { CmsSdkConfig } from "../types.js";

export interface GetEntryByIdParams {
    modelId: string;
    id: string;
    fields: string[];
}

/**
 * Retrieves a single entry from the CMS by its revision ID.
 * 
 * @template TValues - Type of the entry data object. Users should specify this to include all fields they're requesting (id, entryId, values, createdOn, etc.)
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for retrieving the entry
 * @param params.modelId - The model ID of the entry to retrieve
 * @param params.id - The revision ID of the entry (e.g., "123#0001")
 * @param params.fields - Fields to include in the response. Use "values." prefix for entry values (e.g., "values.author.name") or specify top-level fields like "createdOn"
 * @returns The entry data or null if not found
 */
export async function getEntryById<TValues = Record<string, unknown>>(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: GetEntryByIdParams
): Promise<TValues | null> {
    const { modelId, id, fields } = params;

    const { executeGraphQL } = await import("./executeGraphQL.js");

    const query = `
        query GetEntryById($modelId: ID!, $id: ID!, $fields: [String!]!) {
            cms {
                getEntryById(modelId: $modelId, id: $id, fields: $fields) {
                    data
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const data = await executeGraphQL(config, fetchFn, query, { modelId, id, fields });

    if (data.cms.getEntryById.error) {
        throw new Error(data.cms.getEntryById.error.message);
    }

    return data.cms.getEntryById.data;
}
