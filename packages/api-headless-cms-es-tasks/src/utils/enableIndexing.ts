import type { Client } from "@webiny/api-opensearch";
import type { StorageCmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { CmsModelOpenSearchIndexProvider } from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import { getOpenSearchIndexPrefix } from "@webiny/api-opensearch";

interface IEnableIndexingParams {
    client: Client;
    model: StorageCmsModel;
    indexProvider: CmsModelOpenSearchIndexProvider.Interface;
}

export const enableIndexing = async (params: IEnableIndexingParams) => {
    const { client, model, indexProvider } = params;
    const { index: rawIndex } = await indexProvider.execute({ model });
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
