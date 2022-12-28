import { PluginsContainer } from "@webiny/plugins";
import { PluginCollection } from "@webiny/plugins/types";
import { createPlainObjectPathPlugin } from "~/dynamoDb/path/plainObject";
import filters from "@webiny/db-dynamodb/plugins/filters";
import { createFilterCreatePlugins } from "~/operations/entry/filtering/plugins";

export const createPluginsContainer = (plugins: PluginCollection = []): PluginsContainer => {
    return new PluginsContainer([
        ...filters(),
        createPlainObjectPathPlugin(),
        ...createFilterCreatePlugins(),
        ...plugins
    ]);
};
