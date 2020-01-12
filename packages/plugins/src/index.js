// @flow
import type { PluginType } from "@webiny/plugins/types";
import PluginsContainer from "./PluginsContainer";

const __plugins = new PluginsContainer();

const registerPlugins = (...args: any): void => {
    return __plugins.register(...args);
};

const getPlugins = (type: string): Array<PluginType> => {
    return __plugins.byType(type);
};

const getPlugin = (name: string): ?PluginType => {
    return __plugins.byName(name);
};

const unregisterPlugin = (name: string): void => {
    return __plugins.unregister(name);
};

export { PluginsContainer, registerPlugins, getPlugins, getPlugin, unregisterPlugin };
