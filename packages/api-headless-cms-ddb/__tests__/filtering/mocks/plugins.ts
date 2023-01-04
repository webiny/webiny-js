import { PluginsContainer } from "@webiny/plugins";
import { Plugin } from "@webiny/plugins/types";
import { createFilterCreatePlugins } from "~/operations/entry/filtering/plugins";
import dynamoDbValueFilters from "@webiny/db-dynamodb/plugins/filters";

export const createPluginsContainer = (plugins: Plugin[] = []) => {
    return new PluginsContainer([
        ...dynamoDbValueFilters(),
        ...createFilterCreatePlugins(),
        ...plugins
    ]);
};
