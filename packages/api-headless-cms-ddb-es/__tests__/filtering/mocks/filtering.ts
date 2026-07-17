import type { CmsEntryListWhere } from "@webiny/api-headless-cms/types/index.js";
import type { OpenSearchBoolQueryConfig } from "@webiny/api-opensearch/types.js";
import { createFields, createModel } from "./fields";
import { createTestContainer } from "~tests/helpers/createTestContainer";
import { CmsEntryOpenSearchFilterRegistry } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFilter";
import { CmsEntryOpenSearchOperatorList } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchOperatorList";
import { CmsEntryOpenSearchValueTransformer } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchValueTransformer";
import { CmsEntryOpenSearchFieldPathFactory } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFieldPathFactory";
import { CmsEntryOpenSearchExecFilteringClass } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchExecFiltering/CmsEntryOpenSearchExecFilteringImpl";

export interface CreateExecFilteringResponse {
    (params: { where: CmsEntryListWhere; query: OpenSearchBoolQueryConfig }): void;
}

export const createExecFiltering = (): CreateExecFilteringResponse => {
    const testContainer = createTestContainer();
    const operatorList = testContainer.resolve(CmsEntryOpenSearchOperatorList);
    const valueTransformer = testContainer.resolve(CmsEntryOpenSearchValueTransformer);
    const fieldPathFactory = testContainer.resolve(CmsEntryOpenSearchFieldPathFactory);
    const filterRegistry = testContainer.resolve(CmsEntryOpenSearchFilterRegistry);

    const model = createModel();
    const fields = createFields();

    const impl = new CmsEntryOpenSearchExecFilteringClass(
        operatorList,
        valueTransformer,
        fieldPathFactory,
        filterRegistry
    );

    return ({ where, query }) => {
        impl.execute({ model, fields, where, query });
    };
};
