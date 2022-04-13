import { Client } from "@elastic/elasticsearch";
import { ElasticsearchIndexTemplatePluginConfig } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchIndexTemplatePlugin";
import { createElasticsearchClient as createClient } from "@webiny/api-elasticsearch/client";

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || 9200;

export const clearTemplate = async (client: Client, tpl: string | string[]) => {
    const templates = Array.isArray(tpl) ? tpl : [tpl];
    for (const name of templates) {
        try {
            await client.indices.deleteTemplate({
                name
            });
        } catch (ex) {
            console.log("Could not delete template.");
            console.log(JSON.stringify(ex));
        }
    }
};

export const putTemplate = async (
    client: Client,
    template: ElasticsearchIndexTemplatePluginConfig
) => {
    try {
        return await client.indices.putTemplate(template);
    } catch (ex) {
        console.log("Could not put template.");
        console.log(JSON.stringify(ex));
        throw ex;
    }
};

export const getTemplate = async (client: Client) => {
    try {
        return await client.indices.getTemplate();
    } catch (ex) {
        console.log("Could not get templates.");
        console.log(JSON.stringify(ex));
        throw ex;
    }
};

export const deleteIndex = async (client: Client, indices: string[]): Promise<void> => {
    for (const index of indices) {
        try {
            await client.indices.delete({
                index: index
            });
        } catch (ex) {
            console.log(`Could not delete index "${index}".`);
            console.log(JSON.stringify(ex));
        }
    }
};

export const createElasticsearchClient = (): Client => {
    return createClient({
        node: `http://localhost:${ELASTICSEARCH_PORT}`,
        auth: {} as any,
        maxRetries: 10,
        pingTimeout: 500
    });
};
