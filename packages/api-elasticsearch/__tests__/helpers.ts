import { ElasticsearchBoolQueryConfig } from "../src/types";
import { Client } from "@elastic/elasticsearch";
import { ElasticsearchIndexTemplatePluginConfig } from "../src/plugins/definition/ElasticsearchIndexTemplatePlugin";
import { createElasticsearchClient as createClient } from "../src/client";

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || 9200;

export const createBlankQuery = (): ElasticsearchBoolQueryConfig => ({
    must_not: [],
    must: [],
    filter: [],
    should: []
});

export const deleteTemplate = async (client: Client, tpl: string | string[]) => {
    const templates = Array.isArray(tpl) ? tpl : [tpl];
    for (const name of templates) {
        try {
            await client.indices.deleteTemplate({
                name
            });
        } catch (ex) {}
    }
};

export const deleteAllTemplates = async (client: Client): Promise<void> => {
    const response = await getTemplate(client);
    if (!response || !response.body) {
        return;
    }
    const templates = Object.keys(response.body);
    await deleteTemplate(client, templates);
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

export const deleteAllIndices = async (client: Client): Promise<void> => {
    await client.indices.delete({
        index: "_all"
    });
};

export const createElasticsearchClient = (): Client => {
    return createClient({
        node: `http://localhost:${ELASTICSEARCH_PORT}`,
        auth: {} as any,
        maxRetries: 10,
        pingTimeout: 500
    });
};
