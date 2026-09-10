import type { CmsEntryListWhere } from "@webiny/api-headless-cms/types/index.js";
import type { OpenSearchBoolQueryConfig } from "@webiny/api-opensearch/types.js";
import { createFields, createModel } from "./fields";
import { createTestContainer } from "~tests/helpers/createTestContainer";
import { CmsEntryOpenSearchExecFiltering } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchExecFiltering";

export interface CreateExecFilteringResponse {
    (params: { where: CmsEntryListWhere; query: OpenSearchBoolQueryConfig }): void;
}

export const createExecFiltering = (): CreateExecFilteringResponse => {
    const testContainer = createTestContainer();
    const impl = testContainer.resolve(CmsEntryOpenSearchExecFiltering);

    const model = createModel();
    const fields = createFields();

    return ({ where, query }) => {
        impl.execute({ model, fields, where, query });
    };
};
