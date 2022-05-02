import { Client } from "@elastic/elasticsearch";
import { ElasticsearchIndexTemplatePluginConfig } from "../../../api-elasticsearch/src/plugins/definition/ElasticsearchIndexTemplatePlugin";

interface GetTemplateNameParams {
    prefix: string;
    template: ElasticsearchIndexTemplatePluginConfig;
}
const getTemplateName = (params: GetTemplateNameParams): string => {
    const { template, prefix } = params;
    if (!prefix) {
        return template.name;
    }
    const re = new RegExp(`^${prefix}`);
    if (template.name.match(re) !== null) {
        return template.name;
    }
    return `${prefix}${template.name}`;
};

interface PutTemplateParams {
    client: Client;
    prefix: string;
    template: ElasticsearchIndexTemplatePluginConfig;
}
export const putTemplate = async (params: PutTemplateParams) => {
    const { client, template, prefix } = params;
    try {
        return await client.indices.putTemplate({
            ...template,
            name: getTemplateName({
                template,
                prefix
            })
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
    prefix: string;
}
export const deleteTemplates = async (params: DeleteTemplatesParams) => {
    const { client, prefix } = params;

    const response = await client.indices.getTemplate();
    if (!response.body) {
        return;
    }
    const re = new RegExp(`^${prefix}`);
    const items: string[] = Object.keys(response.body).filter(name => {
        if (!prefix) {
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
            // throw ex;
        }
    }
};
