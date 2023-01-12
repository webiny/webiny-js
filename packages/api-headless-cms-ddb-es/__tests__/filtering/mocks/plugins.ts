import { createOperatorPluginList } from "~/operations/entry/elasticsearch/plugins/operator";
import { PluginsContainer } from "@webiny/plugins";
import { Plugin } from "@webiny/plugins/types";
import { getElasticsearchOperators } from "@webiny/api-elasticsearch";
import {
    ElasticsearchQueryBuilderOperatorPlugins,
    ElasticsearchQuerySearchValuePlugins
} from "~/operations/entry/elasticsearch/types";
import { createSearchPluginList } from "~/operations/entry/elasticsearch/plugins/search";
import { createFilterPlugins } from "~/operations/entry/elasticsearch/filtering/plugins";

export const createPluginsContainer = (plugins: Plugin[] = []) => {
    return new PluginsContainer([getElasticsearchOperators(), createFilterPlugins(), ...plugins]);
};

export const buildElasticsearchOperatorPlugins = (container?: PluginsContainer) => {
    return createOperatorPluginList({
        plugins: container || createPluginsContainer(),
        locale: "en-US"
    });
};

export const buildElasticsearchSearchPlugins = (
    container?: PluginsContainer
): ElasticsearchQuerySearchValuePlugins => {
    return createSearchPluginList({
        plugins: container || createPluginsContainer()
    });
};

export interface Plugins {
    operators: ElasticsearchQueryBuilderOperatorPlugins;
    search: ElasticsearchQuerySearchValuePlugins;
    container: PluginsContainer;
}
export const createPlugins = (): Plugins => {
    const container = createPluginsContainer();
    return {
        container,
        operators: buildElasticsearchOperatorPlugins(container),
        search: buildElasticsearchSearchPlugins(container)
    };
};
