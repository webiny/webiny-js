import type { CmsSdkConfig, UnpublishEntryParams, CmsEntry } from "../types.js";
import { executeGraphQL } from "./executeGraphQL.js";

export async function unpublishEntry(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: UnpublishEntryParams
): Promise<CmsEntry> {
    const { modelId, id } = params;

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
