import {
    createExecFiltering as baseCreateExecFiltering,
    CreateExecFilteringResponse
} from "~/operations/entry/elasticsearch/filtering";
import { createFields, createModel } from "./fields";
import { PluginsContainer } from "@webiny/plugins";

export { CreateExecFilteringResponse };

interface Params {
    plugins: PluginsContainer;
}
export const createExecFiltering = (params: Params) => {
    return baseCreateExecFiltering({
        ...params,
        fields: createFields(),
        model: createModel()
    });
};
