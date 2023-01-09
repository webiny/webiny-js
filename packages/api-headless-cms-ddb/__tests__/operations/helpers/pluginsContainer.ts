import { PluginsContainer } from "@webiny/plugins";
import { PluginCollection } from "@webiny/plugins/types";
import { createPlainObjectPathPlugin } from "~/dynamoDb/path/plainObject";
import filters from "@webiny/db-dynamodb/plugins/filters";
import { createFilterCreatePlugins } from "~/operations/entry/filtering/plugins";
import { createGraphQLFields } from "@webiny/api-headless-cms";
import dynamoDbValueFilters from "@webiny/db-dynamodb/plugins/filters";

export const createPluginsContainer = (plugins: PluginCollection = []): PluginsContainer => {
    return new PluginsContainer([
        ...filters(),
        createPlainObjectPathPlugin(),
        ...createGraphQLFields(),
        ...createFilterCreatePlugins(),
        ...dynamoDbValueFilters(),
        ...plugins
    ]);
};
