import type { CmsSdkConfig, DeleteEntryParams } from "../types.js";
import { executeGraphQL } from "./executeGraphQL.js";

export async function deleteEntry(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: DeleteEntryParams
): Promise<boolean> {
    const { modelId, id, permanent = false } = params;

    const query = `
        mutation DeleteEntry($modelId: String!, $id: ID!, $permanent: Boolean) {
            cms {
                deleteEntry(modelId: $modelId, id: $id, permanent: $permanent) {
                    data
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const data = await executeGraphQL(config, fetchFn, query, { modelId, id, permanent });

    if (data.cms.deleteEntry.error) {
        throw new Error(data.cms.deleteEntry.error.message);
    }

    return data.cms.deleteEntry.data;
}
