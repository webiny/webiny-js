import { PluginsContainer } from "@webiny/plugins";
import type { PluginCollection } from "@webiny/plugins/types";
import { createPlainObjectPathPlugin } from "@webiny/api-headless-cms-storage";
import { createFilterCreatePlugins } from "@webiny/api-headless-cms-storage";

export const createPluginsContainer = (plugins: PluginCollection = []): PluginsContainer => {
    return new PluginsContainer([
        createPlainObjectPathPlugin(),
        ...createFilterCreatePlugins(),
        ...plugins
    ]);
};
