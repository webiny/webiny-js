import type { OpenSearchQueryBuilderOperators } from "@webiny/api-headless-cms-utils-os/operations/entry/elasticsearch/types";
import { CmsEntryOpenSearchValueSearchRegistry } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchValueSearch";
import { CmsEntryOpenSearchFilterRegistry } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFilter";
import { CmsEntryOpenSearchOperatorList } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchOperatorList";
import { createTestContainer } from "~tests/helpers/createTestContainer";

export const buildElasticsearchOperatorPlugins = () => {
    const testContainer = createTestContainer();
    const operatorList = testContainer.resolve(CmsEntryOpenSearchOperatorList);
    return operatorList.getAll();
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
