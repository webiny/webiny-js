import type { CmsSdkConfig, CreateEntryParams, CmsEntry } from "../types.js";
import { executeGraphQL } from "./executeGraphQL.js";

export async function createEntry(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: CreateEntryParams
): Promise<CmsEntry> {
    const { modelId, values } = params;

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
