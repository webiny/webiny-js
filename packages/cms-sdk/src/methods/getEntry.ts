import type { CmsSdkConfig, GetEntryParams, CmsEntry } from "../types.js";
import { executeGraphQL } from "./executeGraphQL.js";

export async function getEntry(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: GetEntryParams
): Promise<CmsEntry | null> {
    const { modelId, where, fields, preview } = params;

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
