import { PluginsContainer } from "@webiny/plugins";
import type { PluginCollection } from "@webiny/plugins/types";
import { createPlainObjectPathPlugin } from "~/dynamoDb/path/plainObject";
import { createFilterCreatePlugins } from "~/operations/entry/filtering/plugins";

export const createPluginsContainer = (plugins: PluginCollection = []): PluginsContainer => {
    return new PluginsContainer([
        createPlainObjectPathPlugin(),
        ...createFilterCreatePlugins(),
        ...plugins
    ]);
};
