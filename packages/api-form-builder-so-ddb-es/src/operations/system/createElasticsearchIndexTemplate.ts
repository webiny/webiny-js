import { Client } from "@elastic/elasticsearch";
import { listTemplatePlugins } from "@webiny/api-elasticsearch/templates";
import { FormElasticsearchIndexTemplatePlugin } from "~/plugins/FormElasticsearchIndexTemplatePlugin";
import { PluginsContainer } from "@webiny/plugins";
import WebinyError from "@webiny/error";

interface CreateElasticsearchIndexParams {
    elasticsearch: Client;
    plugins: PluginsContainer;
}

export const createElasticsearchIndexTemplate = async (params: CreateElasticsearchIndexParams) => {
    const { elasticsearch, plugins: container } = params;

    const plugins = listTemplatePlugins<FormElasticsearchIndexTemplatePlugin>(
        container,
        FormElasticsearchIndexTemplatePlugin.type
    );
    /**
     * We need to add all the templates to the Elasticsearch.
     * Order of template plugins does not matter. Use order in the template definition.
     * TODO figure if we need to delete index templates on error
     */
    for (const plugin of plugins) {
        try {
            await elasticsearch.indices.putTemplate(plugin.template);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create Elasticsearch index template for the Form Builder.",
                ex.code || "FB_ELASTICSEARCH_TEMPLATE_ERROR",
                {
                    error: ex,
                    options: plugin.template
                }
            );
        }
    }
};
