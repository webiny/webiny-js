import { createOperatorPluginList } from "~/operations/entry/elasticsearch/plugins/operator";
import { PluginsContainer } from "@webiny/plugins";
import type { Plugin } from "@webiny/plugins/types";
import { getOpenSearchOperators } from "@webiny/api-opensearch";
import type { OpenSearchQueryBuilderOperatorPlugins } from "~/operations/entry/elasticsearch/types";
import { createFilterPlugins } from "~/operations/entry/elasticsearch/filtering/plugins";
import { CmsEntryOpenSearchValueSearchRegistry } from "~/features/CmsEntryOpenSearchValueSearch";
import { createTestContainer } from "~tests/helpers/createTestContainer";

export const createPluginsContainer = (plugins: Plugin[] = []) => {
    return new PluginsContainer([getOpenSearchOperators(), createFilterPlugins(), ...plugins]);
};

export const buildElasticsearchOperatorPlugins = (container?: PluginsContainer) => {
    return createOperatorPluginList({
        plugins: container || createPluginsContainer()
    });
};

export interface Plugins {
    operators: OpenSearchQueryBuilderOperatorPlugins;
    valueSearchRegistry: CmsEntryOpenSearchValueSearchRegistry.Interface;
    container: PluginsContainer;
}
export const createPlugins = (): Plugins => {
    const container = createPluginsContainer();
    const testContainer = createTestContainer();
    return {
        container,
        operators: buildElasticsearchOperatorPlugins(container),
        valueSearchRegistry: testContainer.resolve(CmsEntryOpenSearchValueSearchRegistry)
    };
};
