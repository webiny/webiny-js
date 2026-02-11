import type { CmsSdkConfig } from "../types.js";

export interface DeleteEntryParams {
    modelId: string;
    revision: string;
    permanent?: boolean;
}

export async function deleteEntry(
    config: CmsSdkConfig,
    fetchFn: typeof fetch,
    params: DeleteEntryParams
): Promise<boolean> {
    const { modelId, revision, permanent = false } = params;

    const { executeGraphQL } = await import("./executeGraphQL.js");

    const query = `
        mutation DeleteEntryRevision($modelId: String!, $revision: ID!, $permanent: Boolean) {
            cms {
                deleteEntry(modelId: $modelId, revision: $revision, permanent: $permanent) {
                    data
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const data = await executeGraphQL(config, fetchFn, query, { modelId, revision, permanent });

    if (data.cms.deleteEntry.error) {
        throw new Error(data.cms.deleteEntry.error.message);
    }

    return data.cms.deleteEntry.data;
}
