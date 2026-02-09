import type { CmsSdkConfig } from "../types.js";
import type { CmsEntry } from "./getEntry.js";

export interface PublishEntryParams {
    modelId: string;
    id: string;
    fields?: string[];
}

/**
 * Publishes an entry in the CMS.
 * 
 * @template TValues - Type of the entry values object
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for publishing the entry
 * @param params.modelId - The model ID of the entry to publish
 * @param params.id - The ID of the entry to publish
 * @param params.fields - Optional fields to include in response. Use "values." prefix for entry values (e.g., "values.author.name")
 * @returns The published entry data
 */
export async function publishEntry<TValues = Record<string, unknown>>(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: PublishEntryParams
): Promise<CmsEntry<TValues>> {
    const { modelId, id, fields } = params;

    const { executeGraphQL } = await import("./executeGraphQL.js");

    const query = `
        mutation PublishEntry($modelId: String!, $id: ID!, $fields: [String!]) {
            cms {
                publishEntry(modelId: $modelId, id: $id, fields: $fields) {
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

    if (data.cms.publishEntry.error) {
        throw new Error(data.cms.publishEntry.error.message);
    }

    return data.cms.publishEntry.data;
}
