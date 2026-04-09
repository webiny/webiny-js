import {
    createExecFiltering as baseCreateExecFiltering,
    CreateExecFilteringResponse
} from "~/operations/entry/elasticsearch/filtering";
import { createFields, createModel } from "./fields";
import type { PluginsContainer } from "@webiny/plugins";
import { TimeSearch, RefSearch, SearchableJsonSearch } from "~/elasticsearch/search";

export { CreateExecFilteringResponse };

interface Params {
    plugins: PluginsContainer;
}
export const createExecFiltering = (params: Params) => {
    return baseCreateExecFiltering({
        ...params,
        fields: createFields(),
        model: createModel(),
        valueSearches: [new TimeSearch(), new RefSearch(), new SearchableJsonSearch()]
    });
};
