import { Client } from "@elastic/elasticsearch";
import { createIndex } from "@webiny/api-elasticsearch";
import { FormElasticsearchIndexPlugin } from "~/plugins/FormElasticsearchIndexPlugin";
import { PluginsContainer } from "@webiny/plugins";
import { configurations } from "~/configurations";

interface CreateElasticsearchIndexParams {
    elasticsearch: Client;
    plugins: PluginsContainer;
    tenant: string;
    locale: string;
}

export const createElasticsearchIndex = async (params: CreateElasticsearchIndexParams) => {
    const { elasticsearch, plugins, locale, tenant } = params;

    const { index } = configurations.es({
        locale,
        tenant
    });

    await createIndex({
        client: elasticsearch,
        index,
        type: FormElasticsearchIndexPlugin.type,
        tenant,
        locale,
        plugins,
        onExists: () => {
            console.log(`Elasticsearch index "${index}" for the Form Builder already exists.`);
        },
        onError: (ex: Error) => {
            console.error(`Could not create the Form Builder Elasticsearch index "${index}".`, ex);
            return ex;
        }
    });
};
