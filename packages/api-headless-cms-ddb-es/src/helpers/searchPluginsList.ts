import WebinyError from "@webiny/error";
import { ElasticsearchQueryBuilderValueSearchPlugin } from "~/types";
import { PluginsContainer } from "@webiny/plugins";

export interface ElasticsearchQuerySearchValuePlugins {
    [fieldType: string]: ElasticsearchQueryBuilderValueSearchPlugin;
}

export const searchPluginsList = (
    plugins: PluginsContainer
): ElasticsearchQuerySearchValuePlugins => {
    return plugins
        .byType<ElasticsearchQueryBuilderValueSearchPlugin>(
            "cms-elastic-search-query-builder-value-search"
        )
        .reduce((plugins, plugin) => {
            if (plugins[plugin.fieldType]) {
                throw new WebinyError(
                    "There is a ElasticsearchQueryBuilderValueSearchPlugin defined for the field type.",
                    "PLUGIN_ALREADY_EXISTS",
                    {
                        fieldType: plugin.fieldType,
                        name: plugin.name || "unknown"
                    }
                );
            }
            plugins[plugin.fieldType] = plugin;

            return plugins;
        }, {} as ElasticsearchQuerySearchValuePlugins);
};
