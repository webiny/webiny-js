import type { CmsSdkConfig } from "../types.js";

export interface CreateEntryParams<TValues = Record<string, unknown>> {
    modelId: string;
    values: TValues;
    fields: string[];
}

/**
 * Creates a new entry in the CMS.
 * 
 * @template TValues - Type of the entry data object returned (typically contains id and entryId, or additional fields if specified)
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for creating the entry
 * @param params.modelId - The model ID for the entry
 * @param params.values - The entry values to create
 * @param params.fields - Fields to include in the response. Use "values." prefix for entry values (e.g., "values.author.name") or specify top-level fields like "createdOn"
 * @returns The created entry data
 */
export async function createEntry<TValues = Record<string, unknown>>(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: CreateEntryParams<TValues>
): Promise<TValues> {
    const { modelId, values, fields } = params;

    const { executeGraphQL } = await import("./executeGraphQL.js");

    const query = `
        mutation CreateEntry($modelId: ID!, $data: JSON!, $fields: [String!]!) {
            cms {
                createEntry(modelId: $modelId, data: $data, fields: $fields) {
                    data
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const data = await executeGraphQL(config, fetchFn, query, { modelId, data: values, fields });

    if (data.cms.createEntry.error) {
        throw new Error(data.cms.createEntry.error.message);
    }

    return data.cms.createEntry.data;
}
