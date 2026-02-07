import type { CmsSdkConfig } from "../types.js";
import type { CmsEntry } from "./getEntry.js";

export interface UnpublishEntryParams {
    modelId: string;
    id: string;
}

/**
 * Unpublishes an entry in the CMS.
 * 
 * @template TValues - Type of the entry values object
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for unpublishing the entry
 * @returns The unpublished entry data
 */
export async function unpublishEntry<TValues = Record<string, unknown>>(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: UnpublishEntryParams
): Promise<CmsEntry<TValues>> {
    const { modelId, id } = params;

    const { executeGraphQL } = await import("./executeGraphQL.js");

    const query = `
        mutation UnpublishEntry($modelId: String!, $id: ID!) {
            cms {
                unpublishEntry(modelId: $modelId, id: $id) {
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

    const data = await executeGraphQL(config, fetchFn, query, { modelId, id });

    if (data.cms.unpublishEntry.error) {
        throw new Error(data.cms.unpublishEntry.error.message);
    }

    return data.cms.unpublishEntry.data;
}
