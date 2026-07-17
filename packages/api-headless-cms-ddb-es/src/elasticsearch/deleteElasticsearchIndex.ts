import type { Client } from "@webiny/api-opensearch";
import { isSharedOpenSearchIndex } from "@webiny/api-opensearch";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { configurations } from "~/configurations.js";

interface DeleteElasticsearchIndexParams {
    client: Client;
    model: Pick<CmsModel, "modelId" | "tenant">;
}

export const deleteElasticsearchIndex = async (
    params: DeleteElasticsearchIndexParams
): Promise<void> => {
    /**
     * With shared indexes, a single index holds entries from all tenants
     * for this model. Deleting it would destroy other tenants' data.
     */
    if (isSharedOpenSearchIndex()) {
        return;
    }

    const { client, model } = params;

    const { index } = configurations.es({
        model
    });
    const { body: exists } = await client.indices.exists({
        index
    });
    if (!exists) {
        return;
    }

    try {
        await client.indices.delete({
            index,
            ignore_unavailable: true
        });
    } catch (ex) {
        console.log(`Could not delete Elasticsearch index "${index}". Please do it manually.`);
        console.log(ex.message);
    }
};
