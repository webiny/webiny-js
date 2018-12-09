// @flow
import type { PluginType } from "webiny-plugins/types";

const plugins = {};

export const addPlugin = (...args: Array<PluginType | Array<PluginType>>): void => {
    args.forEach(plugin => {
        const list = Array.isArray(plugin) ? plugin : [plugin];
        list.forEach(plugin => {
            plugins[plugin.name] = plugin;
            plugin.init && plugin.init();
        });
    });
};

export const getPlugins = (type: string): Array<PluginType> => {
    const values: Array<PluginType> = (Object.values(plugins): any);
    return values.filter((plugin: PluginType) => (type ? plugin.type === type : true));
};

export const getPlugin = (name: string): ?PluginType => {
    return plugins[name];
};

export const removePlugin = (name: string): void => {
    delete plugins[name];
};
