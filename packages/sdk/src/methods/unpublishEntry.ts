import type { CmsSdkConfig } from "../types.js";

export interface UnpublishEntryParams {
    modelId: string;
    id: string;
    fields?: string[];
}

/**
 * Unpublishes an entry in the CMS.
 * 
 * @template TValues - Type of the entry data object returned. Specify fields to include via the fields parameter.
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for unpublishing the entry
 * @param params.modelId - The model ID of the entry to unpublish
 * @param params.id - The ID of the entry to unpublish
 * @param params.fields - Optional fields to include in response. Use "values." prefix for entry values (e.g., "values.author.name")
 * @returns The unpublished entry data
 */
export async function unpublishEntry<TValues = Record<string, unknown>>(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: UnpublishEntryParams
): Promise<TValues> {
    const { modelId, id, fields } = params;

    const { executeGraphQL } = await import("./executeGraphQL.js");

    const query = `
        mutation UnpublishEntry($modelId: String!, $id: ID!, $fields: [String!]) {
            cms {
                unpublishEntry(modelId: $modelId, id: $id, fields: $fields) {
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

    if (data.cms.unpublishEntry.error) {
        throw new Error(data.cms.unpublishEntry.error.message);
    }

    return data.cms.unpublishEntry.data;
}
