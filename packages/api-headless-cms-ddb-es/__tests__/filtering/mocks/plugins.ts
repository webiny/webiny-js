import { createOperatorPluginList } from "~/operations/entry/elasticsearch/plugins/operator";
import { PluginsContainer } from "@webiny/plugins";
import type { Plugin } from "@webiny/plugins/types";
import { getOpenSearchOperators } from "@webiny/api-opensearch";
import type {
    OpenSearchQueryBuilderOperatorPlugins,
    OpenSearchQuerySearchValuePlugins
} from "~/operations/entry/elasticsearch/types";
import { createSearchPluginList } from "~/operations/entry/elasticsearch/plugins/search";
import { createFilterPlugins } from "~/operations/entry/elasticsearch/filtering/plugins";
import { TimeSearchImpl, RefSearchImpl, SearchableJsonSearchImpl } from "~/elasticsearch/search";

export const createPluginsContainer = (plugins: Plugin[] = []) => {
    return new PluginsContainer([getOpenSearchOperators(), createFilterPlugins(), ...plugins]);
};

export const buildElasticsearchOperatorPlugins = (container?: PluginsContainer) => {
    return createOperatorPluginList({
        plugins: container || createPluginsContainer()
    });
};

export const buildElasticsearchSearchPlugins = (): OpenSearchQuerySearchValuePlugins => {
    return createSearchPluginList({
        valueSearches: [new TimeSearchImpl(), new RefSearchImpl(), new SearchableJsonSearchImpl()]
    });
};

export interface Plugins {
    operators: OpenSearchQueryBuilderOperatorPlugins;
    search: OpenSearchQuerySearchValuePlugins;
    container: PluginsContainer;
}
export const createPlugins = (): Plugins => {
    const container = createPluginsContainer();
    return {
        container,
        operators: buildElasticsearchOperatorPlugins(container),
        search: buildElasticsearchSearchPlugins()
    };
};
