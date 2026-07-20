import type { Client } from "@webiny/api-opensearch";
import type { CmsModelOpenSearchIndex } from "@webiny/api-headless-cms-ddb-es/exports/api/cms/opensearch.js";
import { getOpenSearchIndexPrefix } from "@webiny/api-opensearch";

interface IEnableIndexingParams {
    client: Client;
    model: CmsModelOpenSearchIndex.Params["model"];
    indexConfig: CmsModelOpenSearchIndex.Interface;
}

export const enableIndexing = async (params: IEnableIndexingParams) => {
    const { client, model, indexConfig } = params;
    const { index: rawIndex } = await indexConfig.execute({ model });
    const prefix = getOpenSearchIndexPrefix();
    const index = prefix ? prefix + rawIndex : rawIndex;
    try {
        await client.indices.putSettings({
            index,
            body: {
                index: {
                    number_of_replicas: 1,
                    refresh_interval: "1s"
                }
            }
        });
    } catch (ex) {
        console.error(ex);
        throw ex;
    }
};
