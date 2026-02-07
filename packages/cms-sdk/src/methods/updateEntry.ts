import type { CmsSdkConfig, UpdateEntryParams, CmsEntry } from "../types.js";
import { executeGraphQL } from "./executeGraphQL.js";

export async function updateEntry(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: UpdateEntryParams
): Promise<CmsEntry> {
    const { modelId, id, values } = params;

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
