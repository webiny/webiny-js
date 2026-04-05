import { PluginsContainer } from "@webiny/plugins";
import type { PluginCollection } from "@webiny/plugins/types";
import { createPlainObjectPathPlugin } from "~/dynamoDb/path/plainObject";
import filters from "@webiny/db-dynamodb/plugins/filters";
import { createFilterCreatePlugins } from "~/operations/entry/filtering/plugins";
import { createFieldRegistry } from "~tests/helpers/createFieldRegistry.js";
import dynamoDbValueFilters from "@webiny/db-dynamodb/plugins/filters";

export const createPluginsContainer = (plugins: PluginCollection = []): PluginsContainer => {
    return new PluginsContainer([
        ...filters(),
        createPlainObjectPathPlugin(),
        ...createFieldRegistry().getAllAsPlugins(),
        ...createFilterCreatePlugins(),
        ...dynamoDbValueFilters(),
        ...plugins
    ]);
};
