import type { Client } from "@webiny/api-opensearch";
import WebinyError from "@webiny/error";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { configurations } from "@webiny/api-headless-cms-ddb-es/configurations.js";
import type { CmsEntryOpenSearchIndex } from "@webiny/api-headless-cms-ddb-es/exports/api/cms/opensearch.js";

export interface ICreateIndexParams {
    client: Client;
    model: Pick<CmsModel, "modelId" | "tenant" | "group">;
    indexConfigs: CmsEntryOpenSearchIndex.Interface[];
}

export const createIndex = async (params: ICreateIndexParams): Promise<void> => {
    const { client, model, indexConfigs } = params;

    const { index } = configurations.es({
        model
    });

    const result = await client.indices.exists({
        index
    });
    if (result.body) {
        return;
    }

    const usable = indexConfigs.filter(c => c.canUse({ model }));
    if (usable.length === 0) {
        throw new WebinyError(
            "Could not find a single usable CmsEntryOpenSearchIndex.",
            "OPENSEARCH_INDEX_TEMPLATE_ERROR"
        );
    }
    const config = usable[usable.length - 1];

    await client.indices.create({
        index,
        body: {
            ...config.body
        }
    });
};
