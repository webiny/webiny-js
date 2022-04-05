import WebinyError from "@webiny/error";
import { Client } from "@elastic/elasticsearch";
import { PluginsContainer } from "@webiny/plugins";
import { CmsElasticsearchIndexTemplatePlugin } from "~/plugins/CmsElasticsearchIndexTemplatePlugin";

export interface CreateElasticsearchTemplateParams {
    elasticsearch: Client;
    plugins: PluginsContainer;
}

export const createElasticsearchTemplate = async (params: CreateElasticsearchTemplateParams) => {
    const { elasticsearch, plugins } = params;

    const templatePlugins = plugins.byType<CmsElasticsearchIndexTemplatePlugin>(
        CmsElasticsearchIndexTemplatePlugin.type
    );

    const names: string[] = [];
    for (const plugin of templatePlugins) {
        const name = plugin.template.name;
        if (names.includes(name)) {
            throw new WebinyError(
                "Duplicate CmsElasticsearchIndexTemplatePlugin template name.",
                "DUPLICATE_TEMPLATE_NAME",
                {
                    name
                }
            );
        }
        names.push(name);
    }

    /**
     * We need to add all the templates to the Elasticsearch.
     * Order of template plugins does not matter. Use order in the template definition.
     * TODO figure if we need to delete templates on error
     */
    for (const plugin of templatePlugins) {
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
