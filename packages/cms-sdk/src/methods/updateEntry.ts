import type { CmsSdkConfig } from "../types.js";
import type { CmsEntry } from "./getEntry.js";

export interface UpdateEntryParams {
    modelId: string;
    id: string;
    values: Record<string, unknown>;
}

export async function updateEntry(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: UpdateEntryParams
): Promise<CmsEntry> {
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
