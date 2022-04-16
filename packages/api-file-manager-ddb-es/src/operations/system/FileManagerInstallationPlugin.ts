import WebinyError from "@webiny/error";
import { InstallationPlugin } from "@webiny/api-file-manager/plugins/definitions/InstallationPlugin";
import { FileManagerContext } from "@webiny/api-file-manager/types";
import { ElasticsearchContext } from "@webiny/api-elasticsearch/types";
import { listTemplatePlugins } from "@webiny/api-elasticsearch/templates";
import { FileElasticsearchIndexTemplatePlugin } from "~/plugins/FileElasticsearchIndexTemplatePlugin";

// TODO @ts-refactor remove when extracting context from this package
interface FileManagerInstallationPluginBeforeInstallParams {
    context: FileManagerContext & ElasticsearchContext;
}
export class FileManagerInstallationPlugin extends InstallationPlugin {
    public override name = "fm.system.ddb-es-installation";

    public override async beforeInstall({
        context
    }: FileManagerInstallationPluginBeforeInstallParams): Promise<void> {
        const { elasticsearch, plugins: container } = context;

        const plugins = listTemplatePlugins<FileElasticsearchIndexTemplatePlugin>(
            container,
            FileElasticsearchIndexTemplatePlugin.type
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
                        "Could not create Elasticsearch index template for the File Manager.",
                    ex.code || "FM_ELASTICSEARCH_TEMPLATE_ERROR",
                    {
                        error: ex,
                        options: plugin.template
                    }
                );
            }
        }
    }
}
