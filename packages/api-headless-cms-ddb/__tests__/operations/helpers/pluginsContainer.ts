import { PluginsContainer } from "@webiny/plugins";
import type { PluginCollection } from "@webiny/plugins/types";
import { createPlainObjectPathPlugin } from "@webiny/db-utils";
import { createFilterCreatePlugins } from "@webiny/db-utils";

export const createPluginsContainer = (plugins: PluginCollection = []): PluginsContainer => {
    return new PluginsContainer([
        createPlainObjectPathPlugin(),
        ...createFilterCreatePlugins(),
        ...plugins
    ]);
};
