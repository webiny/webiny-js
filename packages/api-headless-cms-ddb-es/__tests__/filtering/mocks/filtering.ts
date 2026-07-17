import {
    createExecFiltering as baseCreateExecFiltering,
    type CreateExecFilteringResponse
} from "@webiny/api-headless-cms-utils-os/operations/entry/elasticsearch/filtering";
import { createFields, createModel } from "./fields";
import { createTestContainer } from "~tests/helpers/createTestContainer";
import { CmsEntryOpenSearchFilterRegistry } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFilter";
import { CmsEntryOpenSearchOperatorList } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchOperatorList";
import { CmsEntryOpenSearchValueTransformer } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchValueTransformer";
import { CmsEntryOpenSearchFieldPathFactory } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFieldPathFactory";

export type { CreateExecFilteringResponse };

export const createExecFiltering = () => {
    const testContainer = createTestContainer();
    const operatorList = testContainer.resolve(CmsEntryOpenSearchOperatorList);
    const valueTransformer = testContainer.resolve(CmsEntryOpenSearchValueTransformer);
    const fieldPathFactory = testContainer.resolve(CmsEntryOpenSearchFieldPathFactory);
    const filterRegistry = testContainer.resolve(CmsEntryOpenSearchFilterRegistry);

    return baseCreateExecFiltering({
        operatorList,
        valueTransformer,
        fieldPathFactory,
        fields: createFields(),
        model: createModel(),
        filterRegistry
    });
};
