import { PluginsContainer } from "@webiny/plugins/PluginsContainer.js";
import type { PluginCollection } from "@webiny/plugins/types.js";

export const createMockPluginsContainer = (plugins?: PluginCollection) => {
    return new PluginsContainer(plugins || []);
};
