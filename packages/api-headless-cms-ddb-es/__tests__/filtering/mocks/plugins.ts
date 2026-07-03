import { createOperatorPluginList } from "~/operations/entry/elasticsearch/plugins/operator";
import type { OpenSearchQueryBuilderOperators } from "~/operations/entry/elasticsearch/types";
import { CmsEntryOpenSearchValueSearchRegistry } from "~/features/CmsEntryOpenSearchValueSearch";
import { CmsEntryOpenSearchFilterRegistry } from "~/features/CmsEntryOpenSearchFilter";
import { createTestContainer } from "~tests/helpers/createTestContainer";
import { OpenSearchQueryBuilderOperatorRegistry } from "@webiny/api-opensearch/exports/api/opensearch";

export const buildElasticsearchOperatorPlugins = () => {
    const testContainer = createTestContainer();
    const registry = testContainer.resolve(OpenSearchQueryBuilderOperatorRegistry);
    return createOperatorPluginList({ registry });
};

export interface Plugins {
    operators: OpenSearchQueryBuilderOperators;
    valueSearchRegistry: CmsEntryOpenSearchValueSearchRegistry.Interface;
    filterRegistry: CmsEntryOpenSearchFilterRegistry.Interface;
}

export const createPlugins = (): Plugins => {
    const testContainer = createTestContainer();
    return {
        operators: buildElasticsearchOperatorPlugins(),
        valueSearchRegistry: testContainer.resolve(CmsEntryOpenSearchValueSearchRegistry),
        filterRegistry: testContainer.resolve(CmsEntryOpenSearchFilterRegistry)
    };
};
