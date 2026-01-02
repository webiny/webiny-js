import type { Client } from "@webiny/api-elasticsearch";
import { createIndex as baseCreateIndex } from "@webiny/api-elasticsearch";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { configurations } from "@webiny/api-headless-cms-ddb-es/configurations.js";
import { CmsEntryElasticsearchIndexPlugin } from "@webiny/api-headless-cms-ddb-es/plugins/index.js";
import type { PluginsContainer } from "@webiny/plugins";

export interface ICreateIndexParams {
    client: Client;
    model: Pick<CmsModel, "modelId" | "tenant">;
    plugins: PluginsContainer;
}

export const createIndex = async (params: ICreateIndexParams): Promise<void> => {
    const { client, model, plugins } = params;

    const { index } = configurations.es({
        model
    });

    const result = await client.indices.exists({
        index
    });
    if (result.body) {
        return;
    }

    await baseCreateIndex({
        index,
        client,
        tenant: model.tenant,
        plugins,
        type: CmsEntryElasticsearchIndexPlugin.type
    });
};
