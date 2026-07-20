import type { Client } from "@webiny/api-opensearch";
import type { CmsModelOpenSearchIndex } from "@webiny/api-headless-cms-ddb-es/exports/api/cms/opensearch.js";
import { getOpenSearchIndexPrefix } from "@webiny/api-opensearch";

export interface IDisableIndexingParams {
    client: Client;
    model: CmsModelOpenSearchIndex.Params["model"];
    indexConfig: CmsModelOpenSearchIndex.Interface;
}

export const disableIndexing = async (params: IDisableIndexingParams) => {
    const { client, model, indexConfig } = params;

    const { index: rawIndex } = await indexConfig.execute({ model });
    const prefix = getOpenSearchIndexPrefix();
    const index = prefix ? prefix + rawIndex : rawIndex;

    try {
        await client.indices.putSettings({
            index,
            body: {
                index: {
                    number_of_replicas: 0,
                    refresh_interval: "-1"
                }
            }
        });
    } catch (ex) {
        console.error(ex);
        throw ex;
    }
};
