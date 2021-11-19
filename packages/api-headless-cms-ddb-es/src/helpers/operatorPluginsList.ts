import WebinyError from "@webiny/error";
import { ElasticsearchQueryBuilderOperatorPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchQueryBuilderOperatorPlugin";
import { PluginsContainer } from "@webiny/plugins";

interface OperatorPlugins {
    [operator: string]: ElasticsearchQueryBuilderOperatorPlugin;
}

export const operatorPluginsList = (plugins: PluginsContainer): OperatorPlugins => {
    return plugins
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
