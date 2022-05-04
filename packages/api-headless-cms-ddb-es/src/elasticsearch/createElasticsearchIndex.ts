import WebinyError from "@webiny/error";
import { Client } from "@elastic/elasticsearch";
import { PluginsContainer } from "@webiny/plugins";
import { CmsEntryElasticsearchIndexPlugin } from "~/plugins/CmsEntryElasticsearchIndexPlugin";
import { getLastAddedIndexPlugin } from "@webiny/api-elasticsearch/indices";
import { configurations } from "~/configurations";
import { CmsModel } from "@webiny/api-headless-cms/types";

export interface CreateElasticsearchIndexParams {
    elasticsearch: Client;
    plugins: PluginsContainer;
    model: CmsModel;
}

export const createElasticsearchIndex = async (params: CreateElasticsearchIndexParams) => {
    const { elasticsearch, plugins: container, model } = params;

    const plugin = getLastAddedIndexPlugin<CmsEntryElasticsearchIndexPlugin>({
        container,
        type: CmsEntryElasticsearchIndexPlugin.type,
        locale: model.locale
    });

    const { index } = configurations.es({
        model
    });

    try {
        const response = await elasticsearch.indices.exists({
            index
        });
        if (response.body) {
            return;
        }
        await elasticsearch.indices.create({
            index,
            body: plugin.body
        });
    } catch (ex) {
        throw new WebinyError(
            ex.message || "Could not create Elasticsearch index for the Headless CMS model.",
            ex.code || "CMS_ELASTICSEARCH_INDEX_ERROR",
            {
                error: ex,
                type: CmsEntryElasticsearchIndexPlugin.type,
                locale: model.locale,
                tenant: model.tenant,
                body: plugin.body
            }
        );
    }
};
