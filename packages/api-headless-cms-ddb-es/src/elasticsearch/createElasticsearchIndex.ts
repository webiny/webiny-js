import { Client } from "@elastic/elasticsearch";
import { PluginsContainer } from "@webiny/plugins";
import { CmsEntryElasticsearchIndexPlugin } from "~/plugins/CmsEntryElasticsearchIndexPlugin";
import { createIndex } from "@webiny/api-elasticsearch";
import { configurations } from "~/configurations";
import { CmsModel } from "@webiny/api-headless-cms/types";

export interface CreateElasticsearchIndexParams {
    client: Client;
    plugins: PluginsContainer;
    model: CmsModel;
}

export const createElasticsearchIndex = async (params: CreateElasticsearchIndexParams) => {
    const { client, plugins, model } = params;

    const { index } = configurations.es({
        model
    });

    await createIndex({
        client,
        index,
        type: CmsEntryElasticsearchIndexPlugin.type,
        tenant: model.tenant,
        locale: model.locale,
        plugins,
        onExists: () => {
            console.log(
                `Elasticsearch index "${index}" for the CMS model "${model.name}" already exists.`
            );
        },
        onError: ex => {
            console.error(
                `Could not create Elasticsearch index "${index}" for the CMS model "${model.name}".`
            );
            return ex;
        }
    });
};
