import type { Client } from "@webiny/api-opensearch";
import type { CmsModelOpenSearchIndex } from "@webiny/api-headless-cms-ddb-es/exports/api/cms/opensearch.js";
import { getOpenSearchIndexPrefix } from "@webiny/api-opensearch";

export interface ICreateIndexParams {
    client: Client;
    model: CmsModelOpenSearchIndex.Params["model"];
    indexConfig: CmsModelOpenSearchIndex.Interface;
}

export const createIndex = async (params: ICreateIndexParams): Promise<void> => {
    const { client, model, indexConfig } = params;

    const { index: rawIndex, settings } = await indexConfig.execute({ model });

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
