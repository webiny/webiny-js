import type { CmsSdkConfig } from "../types.js";
import type { CmsEntry } from "./getEntry.js";

export interface PublishEntryParams {
    modelId: string;
    id: string;
}

/**
 * Publishes an entry in the CMS.
 * 
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for publishing the entry
 * @returns The published entry data (id and entryId only)
 */
export async function publishEntry(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: PublishEntryParams
): Promise<CmsEntry> {
    const { modelId, id } = params;

    const { executeGraphQL } = await import("./executeGraphQL.js");

    const query = `
        mutation PublishEntry($modelId: String!, $id: ID!) {
            cms {
                publishEntry(modelId: $modelId, id: $id) {
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

    if (data.cms.publishEntry.error) {
        throw new Error(data.cms.publishEntry.error.message);
    }

    return data.cms.publishEntry.data;
}
