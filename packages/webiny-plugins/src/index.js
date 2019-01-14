// @flow
import type { PluginType } from "webiny-plugins/types";
import warning from "warning";

const __plugins = {};

const _register = plugins => {
    for (let i = 0; i < plugins.length; i++) {
        let plugin = plugins[i];
        if (Array.isArray(plugin)) {
            _register(plugin);
            continue;
        }

        const name = plugin._name || plugin.name;
        if (!name) {
            throw Error(`Plugin must have a "name" or "_name" key.`);
        }

        warning(!__plugins[name], `Overriding an existing plugin "${name}".`);

        __plugins[name] = plugin;
        plugin.init && plugin.init();
    }
};

export const registerPlugins = (...args: any): void => _register(args);

export const getPlugins = (type: string): Array<PluginType> => {
    const values: Array<PluginType> = (Object.values(__plugins): any);
    return values.filter((plugin: PluginType) => (type ? plugin.type === type : true));
};

export const getPlugin = (name: string): ?PluginType => {
    return __plugins[name];
};

export const unregisterPlugin = (name: string): void => {
    delete __plugins[name];
};
