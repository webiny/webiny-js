import WebinyError from "@webiny/error";
import { ElasticsearchQueryBuilderValueSearchPlugin } from "../types";
import { CmsContext } from "@webiny/api-headless-cms/types";

export interface ElasticsearchQuerySearchValuePlugins {
    [fieldType: string]: ElasticsearchQueryBuilderValueSearchPlugin;
}

export const searchPluginsList = (context: CmsContext): ElasticsearchQuerySearchValuePlugins => {
    return context.plugins
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
