import type { Client } from "@webiny/api-opensearch";
import type { CmsModelOpenSearchIndexProvider } from "@webiny/api-headless-cms-ddb-es/features/CmsModelOpenSearchIndex/CmsModelOpenSearchIndexProvider.js";
import type { ICmsModelOpenSearchIndexModel } from "@webiny/api-headless-cms-ddb-es/features/CmsModelOpenSearchIndex/abstractions.js";
import { getOpenSearchIndexPrefix } from "@webiny/api-opensearch";

export interface ICreateIndexParams {
    client: Client;
    model: ICmsModelOpenSearchIndexModel;
    indexProvider: CmsModelOpenSearchIndexProvider.Interface;
}

export const createIndex = async (params: ICreateIndexParams): Promise<void> => {
    const { client, model, indexProvider } = params;

    const { index: rawIndex, settings } = await indexProvider.execute({ model });

    const prefix = getOpenSearchIndexPrefix();
    const index = prefix ? prefix + rawIndex : rawIndex;

    const result = await client.indices.exists({
        index
    });
    if (result.body) {
        return;
    }

    await client.indices.create({
        index,
        body: {
            ...settings
        }
    });
};
