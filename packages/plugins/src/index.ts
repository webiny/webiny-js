import { Plugin } from "./types";
import { PluginsContainer } from "./PluginsContainer";

const plugins = new PluginsContainer();

const registerPlugins = (...args: any): void => {
    plugins.register(...args);
};

const getPlugins = <T extends Plugin = Plugin>(type?: string) => {
    return plugins.byType<T>(type);
};

const getPlugin = <T extends Plugin = Plugin>(name: string) => {
    return plugins.byName<T>(name);
};

const unregisterPlugin = (name: string): void => {
    return plugins.unregister(name);
};

export { PluginsContainer, plugins, registerPlugins, getPlugins, getPlugin, unregisterPlugin };
