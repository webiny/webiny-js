import type { Client } from "@webiny/api-opensearch";
import type { StorageCmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { CmsModelOpenSearchIndexProvider } from "@webiny/api-headless-cms-ddb-es/features/CmsModelOpenSearchIndex/CmsModelOpenSearchIndexProvider.js";
import { getOpenSearchIndexPrefix } from "@webiny/api-opensearch";

export interface IDisableIndexingParams {
    client: Client;
    model: StorageCmsModel;
    indexProvider: CmsModelOpenSearchIndexProvider.Interface;
}

export const disableIndexing = async (params: IDisableIndexingParams) => {
    const { client, model, indexProvider } = params;

    const { index: rawIndex } = await indexProvider.execute({ model });
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
