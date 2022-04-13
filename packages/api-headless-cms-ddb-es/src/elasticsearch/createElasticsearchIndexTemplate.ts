import WebinyError from "@webiny/error";
import { Client } from "@elastic/elasticsearch";
import { PluginsContainer } from "@webiny/plugins";
import { CmsEntryElasticsearchIndexTemplatePlugin } from "~/plugins/CmsEntryElasticsearchIndexTemplatePlugin";
import { listTemplatePlugins } from "@webiny/api-elasticsearch/templates";

export interface CreateElasticsearchTemplateParams {
    elasticsearch: Client;
    plugins: PluginsContainer;
    locale: string;
}

export const createElasticsearchIndexTemplate = async (
    params: CreateElasticsearchTemplateParams
) => {
    const { elasticsearch, plugins: container, locale } = params;

    const plugins = listTemplatePlugins<CmsEntryElasticsearchIndexTemplatePlugin>(
        container,
        CmsEntryElasticsearchIndexTemplatePlugin.type,
        locale
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
                ex.message || "Could not create Elasticsearch index template for the Headless CMS.",
                ex.code || "CMS_ELASTICSEARCH_TEMPLATE_ERROR",
                {
                    error: ex,
                    options: plugin.template
                }
            );
        }
    }
};
