import type { CmsSdkConfig } from "../types.js";
import type { CmsEntry } from "./getEntry.js";

export interface UpdateEntryParams<TValues = Record<string, unknown>> {
    modelId: string;
    id: string;
    values: TValues;
}

/**
 * Updates an existing entry in the CMS.
 * 
 * @template TValues - Type of the entry values object
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for updating the entry
 * @returns The updated entry data
 */
export async function updateEntry<TValues = Record<string, unknown>>(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: UpdateEntryParams<TValues>
): Promise<CmsEntry<TValues>> {
    const { modelId, id, values } = params;

    const { executeGraphQL } = await import("./executeGraphQL.js");

    const query = `
        mutation UpdateEntry($modelId: String!, $id: ID!, $values: JSON!) {
            cms {
                updateEntry(modelId: $modelId, id: $id, values: $values) {
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

    const data = await executeGraphQL(config, fetchFn, query, { modelId, id, values });

    if (data.cms.updateEntry.error) {
        throw new Error(data.cms.updateEntry.error.message);
    }

    return data.cms.updateEntry.data;
}
