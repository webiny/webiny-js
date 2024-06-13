import { Client, createIndex as baseCreateIndex } from "@webiny/api-elasticsearch";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { configurations } from "@webiny/api-headless-cms-ddb-es/configurations";
import { CmsEntryElasticsearchIndexPlugin } from "@webiny/api-headless-cms-ddb-es/plugins";
import { PluginsContainer } from "@webiny/plugins";

export interface ICreateIndexParams {
    client: Client;
    model: Pick<CmsModel, "modelId" | "tenant" | "locale">;
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
        locale: model.locale,
        tenant: model.tenant,
        plugins,
        type: CmsEntryElasticsearchIndexPlugin.type
    });
};
