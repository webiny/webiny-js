import type { CmsSdkConfig } from "../types.js";

export interface UpdateEntryParams<TValues = Record<string, unknown>> {
    modelId: string;
    revision: string;
    values: TValues;
    fields: string[];
}

/**
 * Updates an existing entry in the CMS.
 * 
 * @template TValues - Type of the entry data object returned (typically contains id and entryId, or additional fields if specified)
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for updating the entry revision
 * @param params.modelId - The model ID for the entry
 * @param params.revision - The revision ID of the entry to update
 * @param params.values - The updated entry values
 * @param params.fields - Fields to include in the response. Use "values." prefix for entry values (e.g., "values.author.name") or specify top-level fields like "createdOn"
 * @returns The updated entry data
 */
export async function updateEntry<TValues = Record<string, unknown>>(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: UpdateEntryParams<TValues>
): Promise<TValues> {
    const { modelId, revision, values, fields } = params;

    const { executeGraphQL } = await import("./executeGraphQL.js");

    const query = `
        mutation UpdateEntryRevision($modelId: ID!, $revision: ID!, $data: JSON!, $fields: [String!]!) {
            cms {
                updateEntry(modelId: $modelId, revision: $revision, data: $data, fields: $fields) {
                    data
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const data = await executeGraphQL(config, fetchFn, query, { modelId, revision, data: values, fields });

    if (data.cms.updateEntry.error) {
        throw new Error(data.cms.updateEntry.error.message);
    }

    return data.cms.updateEntry.data;
}
