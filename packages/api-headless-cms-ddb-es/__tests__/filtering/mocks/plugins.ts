import { createOperatorPluginList } from "~/operations/entry/elasticsearch/plugins/operator";
import { PluginsContainer } from "@webiny/plugins";
import { getOpenSearchOperators } from "@webiny/api-opensearch";
import type { OpenSearchQueryBuilderOperatorPlugins } from "~/operations/entry/elasticsearch/types";
import { CmsEntryOpenSearchValueSearchRegistry } from "~/features/CmsEntryOpenSearchValueSearch";
import { CmsEntryOpenSearchFilterRegistry } from "~/features/CmsEntryOpenSearchFilter";
import { createTestContainer } from "~tests/helpers/createTestContainer";

export const createPluginsContainer = () => {
    return new PluginsContainer([getOpenSearchOperators()]);
};

export const buildElasticsearchOperatorPlugins = (container?: PluginsContainer) => {
    return createOperatorPluginList({
        plugins: container || createPluginsContainer()
    });
};

export interface Plugins {
    operators: OpenSearchQueryBuilderOperatorPlugins;
    valueSearchRegistry: CmsEntryOpenSearchValueSearchRegistry.Interface;
    filterRegistry: CmsEntryOpenSearchFilterRegistry.Interface;
    container: PluginsContainer;
}
export const createPlugins = (): Plugins => {
    const container = createPluginsContainer();
    const testContainer = createTestContainer();
    return {
        container,
        operators: buildElasticsearchOperatorPlugins(container),
        valueSearchRegistry: testContainer.resolve(CmsEntryOpenSearchValueSearchRegistry),
        filterRegistry: testContainer.resolve(CmsEntryOpenSearchFilterRegistry)
    };
};
