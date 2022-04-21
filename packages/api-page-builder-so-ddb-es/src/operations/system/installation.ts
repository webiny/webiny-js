import WebinyError from "@webiny/error";
import { Client } from "@elastic/elasticsearch";
import { listTemplatePlugins } from "@webiny/api-elasticsearch/templates";
import { PluginsContainer } from "@webiny/plugins";
import { PageElasticsearchIndexTemplatePlugin } from "~/plugins/definitions/PageElasticsearchIndexTemplatePlugin";

export interface ExecOnBeforeInstallParams {
    elasticsearch: Client;
    plugins: PluginsContainer;
}
export const execOnBeforeInstall = async (params: ExecOnBeforeInstallParams): Promise<void> => {
    const { elasticsearch, plugins: container } = params;

    const plugins = listTemplatePlugins<PageElasticsearchIndexTemplatePlugin>(
        container,
        PageElasticsearchIndexTemplatePlugin.type
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
                ex.message ||
                    "Could not create Elasticsearch index template for the Page Builder Pages.",
                ex.code || "PB_ELASTICSEARCH_TEMPLATE_ERROR",
                {
                    error: ex,
                    options: plugin.template
                }
            );
        }
    }
};
