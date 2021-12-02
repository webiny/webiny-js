import WebinyError from "@webiny/error";
import { PluginsContainer } from "@webiny/plugins";
import { CmsEntryElasticsearchQueryBuilderValueSearchPlugin } from "~/plugins/CmsEntryElasticsearchQueryBuilderValueSearchPlugin";

export interface ElasticsearchQuerySearchValuePlugins {
    [fieldType: string]: CmsEntryElasticsearchQueryBuilderValueSearchPlugin;
}

export const searchPluginsList = (
    plugins: PluginsContainer
): ElasticsearchQuerySearchValuePlugins => {
    return plugins
        .byType<CmsEntryElasticsearchQueryBuilderValueSearchPlugin>(
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
