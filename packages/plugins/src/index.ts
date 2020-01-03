import { Plugin } from "./types";

const __plugins = {};

const _register = plugins => {
    for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        if (Array.isArray(plugin)) {
            _register(plugin);
            continue;
        }

        const name = plugin._name || plugin.name;
        if (!name) {
            throw Error(`Plugin must have a "name" or "_name" key.`);
        }

        __plugins[name] = plugin;
        plugin.init && plugin.init();
    }
};

export const registerPlugins = (...args: any): void => _register(args);

export const getPlugins = (type?: string): Array<Plugin> => {
    const values: Plugin[] = Object.values(__plugins);
    return values.filter((plugin: Plugin) => (type ? plugin.type === type : true));
};

export const getPlugin = (name: string): Plugin | null => {
    return __plugins[name];
};

export const unregisterPlugin = (name: string): void => {
    delete __plugins[name];
};
