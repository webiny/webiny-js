import { Client } from "@elastic/elasticsearch";
import { ElasticsearchIndexTemplatePluginConfig } from "../../../api-elasticsearch/src/plugins/definition/ElasticsearchIndexTemplatePlugin";

interface PutTemplateParams {
    client: Client;
    template: ElasticsearchIndexTemplatePluginConfig;
}
export const putTemplate = async (params: PutTemplateParams) => {
    const { client, template } = params;
    try {
        return await client.indices.putTemplate({
            ...template,
            name: `${template.name}`
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
    templates: string[];
}
export const deleteTemplates = async (params: DeleteTemplatesParams) => {
    const { client, templates } = params;

    const response = await client.indices.getTemplate();
    if (!response.body) {
        return;
    }
    const items: string[] = Object.keys(response.body).filter(name => {
        return templates.includes(name);
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
