import { Client } from "@elastic/elasticsearch";
import { ElasticsearchIndexTemplatePluginConfig } from "../../../api-elasticsearch/src/plugins/definition/ElasticsearchIndexTemplatePlugin";

const defaultPrefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";

interface PutTemplateParams {
    client: Client;
    prefix?: string;
    template: ElasticsearchIndexTemplatePluginConfig;
}
export const putTemplate = async (params: PutTemplateParams) => {
    const { client, template, prefix = defaultPrefix } = params;
    try {
        return await client.indices.putTemplate({
            ...template,
            name: `${prefix || ""}${template.name}`
        });
    } catch (ex) {
        console.log("Could not put template.");
        console.log(JSON.stringify(ex));
        throw ex;
    }
};

interface GetTemplatesParams {
    client: Client;
}
export const getTemplates = async (params: GetTemplatesParams) => {
    const { client } = params;
    try {
        return await client.indices.getTemplate();
    } catch (ex) {
        console.log("Could not get templates.");
        console.log(JSON.stringify(ex));
        throw ex;
    }
};

interface DeleteTemplatesParams {
    client: Client;
    templates?: string[];
    prefix?: string;
}
export const deleteTemplates = async (params: DeleteTemplatesParams) => {
    const { client, templates, prefix = defaultPrefix } = params;

    const re = prefix ? new RegExp(`^${prefix}`) : null;
    const response = await client.indices.getTemplate();
    if (!response.body) {
        return;
    }
    const items: string[] = Object.keys(response.body).filter(name => {
        if (templates) {
            return templates.includes(name);
        } else if (!re) {
            return true;
        }
        return name.match(re) !== null;
    });
    if (items.length === 0) {
        return;
    }

    for (const name of items) {
        try {
            await client.indices.deleteTemplate({
                name
            });
        } catch (ex) {
            console.log(ex.message);
            throw ex;
        }
    }
};
