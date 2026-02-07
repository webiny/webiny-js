import type { CmsSdkConfig } from "../types.js";

export interface GetEntryParams {
    modelId: string;
    where: Record<string, unknown>;
    fields?: string[];
    preview?: boolean;
}

export interface CmsEntry<TValues = Record<string, unknown>> {
    id: string;
    entryId: string;
    values?: TValues;
    [key: string]: unknown;
}

/**
 * Retrieves a single entry from the CMS.
 * 
 * @template TValues - Type of the entry values object
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for retrieving the entry
 * @param params.modelId - The model ID of the entry to retrieve
 * @param params.where - Where conditions to filter the entry
 * @param params.fields - Optional fields to include in the response (dot notation supported)
 * @param params.preview - When true, uses preview API to access unpublished/draft content. When false (default), uses read API for published content only.
 * @returns The entry data or null if not found
 */
export async function getEntry<TValues = Record<string, unknown>>(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: GetEntryParams
): Promise<CmsEntry<TValues> | null> {
    const { modelId, where, fields, preview } = params;

    const { executeGraphQL } = await import("./executeGraphQL.js");

    const query = `
        query GetEntry($modelId: String!, $where: JSON!, $fields: [String!], $preview: Boolean) {
            cms {
                getEntry(modelId: $modelId, where: $where, fields: $fields, preview: $preview) {
                    data
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const data = await executeGraphQL(config, fetchFn, query, { modelId, where, fields, preview });

    if (data.cms.getEntry.error) {
        throw new Error(data.cms.getEntry.error.message);
    }

    return data.cms.getEntry.data;
}
