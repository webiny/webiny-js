import { Client } from "@elastic/elasticsearch";
import { getLastAddedIndexPlugin } from "@webiny/api-elasticsearch/indices";
import { FormElasticsearchIndexPlugin } from "~/plugins/FormElasticsearchIndexPlugin";
import { PluginsContainer } from "@webiny/plugins";
import WebinyError from "@webiny/error";
import { configurations } from "~/configurations";

interface CreateElasticsearchIndexParams {
    elasticsearch: Client;
    plugins: PluginsContainer;
    tenant: string;
    locale: string;
}

export const createElasticsearchIndex = async (params: CreateElasticsearchIndexParams) => {
    const { elasticsearch, plugins: container, locale, tenant } = params;

    const plugin = getLastAddedIndexPlugin<FormElasticsearchIndexPlugin>({
        container,
        type: FormElasticsearchIndexPlugin.type,
        locale
    });

    const { index } = configurations.es({
        locale,
        tenant
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
            ex.message || "Could not create Elasticsearch index for the Form Builder.",
            ex.code || "FB_ELASTICSEARCH_INDEX_ERROR",
            {
                error: ex,
                type: FormElasticsearchIndexPlugin.type,
                locale,
                tenant,
                index,
                body: plugin.body
            }
        );
    }
};
