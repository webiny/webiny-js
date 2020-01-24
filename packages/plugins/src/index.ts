import { Plugin } from "./types";
import { PluginsContainer } from "./PluginsContainer";

const __plugins = new PluginsContainer();

const registerPlugins = (...args: any): void => {
    __plugins.register(...args);
};

const getPlugins = <T extends Plugin = Plugin>(type?: string) => {
    return __plugins.byType<T>(type);
};

const getPlugin = <T extends Plugin = Plugin>(name: string)=> {
    return __plugins.byName<T>(name);
};

const unregisterPlugin = (name: string): void => {
    return __plugins.unregister(name);
};

export { PluginsContainer, registerPlugins, getPlugins, getPlugin, unregisterPlugin };
