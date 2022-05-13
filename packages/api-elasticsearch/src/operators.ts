import {
    ElasticsearchQueryBuilderOperatorBetweenPlugin,
    ElasticsearchQueryBuilderJapaneseOperatorContainsPlugin,
    ElasticsearchQueryBuilderOperatorAndInPlugin,
    ElasticsearchQueryBuilderOperatorGreaterThanOrEqualToPlugin,
    ElasticsearchQueryBuilderOperatorGreaterThanPlugin,
    ElasticsearchQueryBuilderOperatorContainsPlugin,
    ElasticsearchQueryBuilderOperatorLesserThanOrEqualToPlugin,
    ElasticsearchQueryBuilderOperatorInPlugin,
    ElasticsearchQueryBuilderOperatorLesserThanPlugin,
    ElasticsearchQueryBuilderOperatorNotBetweenPlugin,
    ElasticsearchQueryBuilderOperatorNotContainsPlugin,
    ElasticsearchQueryBuilderOperatorNotPlugin,
    ElasticsearchQueryBuilderOperatorNotInPlugin,
    ElasticsearchQueryBuilderOperatorEqualPlugin,
    ElasticsearchQueryBuilderOperatorStartsWithPlugin,
    ElasticsearchQueryBuilderOperatorNotStartsWithPlugin
} from "~/plugins/operator";
// import { ElasticsearchQueryBuilderOperatorNotBetweenPlugin } from "~/plugins/operator/notBetween";
// import { ElasticsearchQueryBuilderOperatorContainsPlugin } from "~/plugins/operator/contains";
// import { ElasticsearchQueryBuilderOperatorNotContainsPlugin } from "~/plugins/operator/notContains";
// import { ElasticsearchQueryBuilderOperatorEqualPlugin } from "~/plugins/operator/equal";
// import { ElasticsearchQueryBuilderOperatorNotPlugin } from "~/plugins/operator/not";
// import { ElasticsearchQueryBuilderOperatorGreaterThanPlugin } from "~/plugins/operator/gt";
// import { ElasticsearchQueryBuilderOperatorGreaterThanOrEqualToPlugin } from "~/plugins/operator/gte";
// import { ElasticsearchQueryBuilderOperatorLesserThanPlugin } from "~/plugins/operator/lt";
// import { ElasticsearchQueryBuilderOperatorLesserThanOrEqualToPlugin } from "~/plugins/operator/lte";
// import { ElasticsearchQueryBuilderOperatorInPlugin } from "~/plugins/operator/in";
// import { ElasticsearchQueryBuilderOperatorAndInPlugin } from "~/plugins/operator/andIn";
// import { ElasticsearchQueryBuilderOperatorNotInPlugin } from "~/plugins/operator/notIn";
import { PluginsContainer } from "@webiny/plugins";
import { ElasticsearchQueryBuilderOperatorPlugin } from "~/plugins/definition/ElasticsearchQueryBuilderOperatorPlugin";

const operators = [
    new ElasticsearchQueryBuilderOperatorBetweenPlugin(),
    new ElasticsearchQueryBuilderOperatorNotBetweenPlugin(),
    new ElasticsearchQueryBuilderOperatorContainsPlugin(),
    new ElasticsearchQueryBuilderOperatorNotContainsPlugin(),
    new ElasticsearchQueryBuilderOperatorEqualPlugin(),
    new ElasticsearchQueryBuilderOperatorNotPlugin(),
    new ElasticsearchQueryBuilderOperatorGreaterThanPlugin(),
    new ElasticsearchQueryBuilderOperatorGreaterThanOrEqualToPlugin(),
    new ElasticsearchQueryBuilderOperatorLesserThanPlugin(),
    new ElasticsearchQueryBuilderOperatorLesserThanOrEqualToPlugin(),
    new ElasticsearchQueryBuilderOperatorInPlugin(),
    new ElasticsearchQueryBuilderOperatorAndInPlugin(),
    new ElasticsearchQueryBuilderOperatorNotInPlugin(),
    new ElasticsearchQueryBuilderOperatorStartsWithPlugin(),
    new ElasticsearchQueryBuilderOperatorNotStartsWithPlugin(),
    /**
     * Japanese
     */
    new ElasticsearchQueryBuilderJapaneseOperatorContainsPlugin()
];
/**
 * We export as a function because there might be something to be sent to the operators at some point.
 * This way, we make it easier to upgrade.
 */
export const getElasticsearchOperators = () => operators;

export const getElasticsearchOperatorPluginsByLocale = (
    plugins: PluginsContainer,
    locale: string
): Record<string, ElasticsearchQueryBuilderOperatorPlugin> => {
    /**
     * We always set the last one operator plugin added.
     * This way user can override the plugins.
     */
    return plugins
        .byType<ElasticsearchQueryBuilderOperatorPlugin>(
            ElasticsearchQueryBuilderOperatorPlugin.type
        )
        .reduce((acc, plugin) => {
            const op = plugin.getOperator();
            /**
             * We only allow the plugins which can pass the locale test.
             * The default plugins always return true.
             */
            if (plugin.isLocaleSupported(locale) === false) {
                return acc;
            }
            /**
             * We also only allow the override of the plugins if the new plugin is NOT a default one.
             * If a user names the plugin with .default, we cannot do anything about it.
             */
            if (!!acc[op] && (plugin.name || "").match(/\.default$/)) {
                return acc;
            }
            acc[op] = plugin;
            return acc;
        }, {} as Record<string, ElasticsearchQueryBuilderOperatorPlugin>);
};
