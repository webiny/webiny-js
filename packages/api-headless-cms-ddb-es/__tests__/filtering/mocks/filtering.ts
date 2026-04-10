import {
    createExecFiltering as baseCreateExecFiltering,
    type CreateExecFilteringResponse
} from "~/operations/entry/elasticsearch/filtering";
import { createFields, createModel } from "./fields";
import type { PluginsContainer } from "@webiny/plugins";
import { createTestContainer } from "~tests/helpers/createTestContainer";
import { CmsEntryOpenSearchValueSearchRegistry } from "~/features/CmsEntryOpenSearchValueSearch";

export type { CreateExecFilteringResponse };

const testContainer = createTestContainer();
const valueSearchRegistry = testContainer.resolve(CmsEntryOpenSearchValueSearchRegistry);

interface Params {
    plugins: PluginsContainer;
}
export const createExecFiltering = (params: Params) => {
    return baseCreateExecFiltering({
        ...params,
        fields: createFields(),
        model: createModel(),
        valueSearchRegistry
    });
};
