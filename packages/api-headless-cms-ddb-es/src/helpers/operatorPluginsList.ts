import WebinyError from "@webiny/error";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { ElasticsearchQueryBuilderOperatorPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchQueryBuilderOperatorPlugin";

interface OperatorPlugins {
    [operator: string]: ElasticsearchQueryBuilderOperatorPlugin;
}

export const operatorPluginsList = (context: CmsContext): OperatorPlugins => {
    return context.plugins
        .byType<ElasticsearchQueryBuilderOperatorPlugin>(
            ElasticsearchQueryBuilderOperatorPlugin.type
        )
        .reduce((plugins, plugin) => {
            const operator = plugin.getOperator();
            if (plugins[operator]) {
                throw new WebinyError(
                    "There is a ElasticsearchQueryBuilderOperatorPlugin defined for the operator.",
                    "PLUGIN_ALREADY_EXISTS",
                    {
                        operator: operator,
                        name: plugin.name || "unknown"
                    }
                );
            }
            plugins[operator] = plugin;

            return plugins;
        }, {} as OperatorPlugins);
};
