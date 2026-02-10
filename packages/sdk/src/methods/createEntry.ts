import type { CmsSdkConfig } from "../types.js";

export interface CreateEntryParams<TValues = Record<string, unknown>> {
    modelId: string;
    values: TValues;
}

/**
 * Creates a new entry in the CMS.
 * 
 * @template TValues - Type of the entry data object returned (typically contains id and entryId)
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for creating the entry
 * @returns The created entry data
 */
export async function createEntry<TValues = Record<string, unknown>>(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: CreateEntryParams<TValues>
): Promise<TValues> {
    const { modelId, values } = params;

    const { executeGraphQL } = await import("./executeGraphQL.js");

    const query = `
        mutation CreateEntry($modelId: String!, $values: JSON!) {
            cms {
                createEntry(modelId: $modelId, values: $values) {
                    data {
                        id
                        entryId
                    }
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const data = await executeGraphQL(config, fetchFn, query, { modelId, values });

    if (data.cms.createEntry.error) {
        throw new Error(data.cms.createEntry.error.message);
    }

    return data.cms.createEntry.data;
}
