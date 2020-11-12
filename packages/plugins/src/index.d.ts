import { Plugin } from "./types";
import { PluginsContainer } from "./PluginsContainer";
declare const plugins: PluginsContainer;
declare const registerPlugins: (...args: any) => void;
declare const getPlugins: <T extends Plugin = Plugin>(type?: string) => T[];
declare const getPlugin: <T extends Plugin = Plugin>(name: string) => T;
declare const unregisterPlugin: (name: string) => void;
export { PluginsContainer, plugins, registerPlugins, getPlugins, getPlugin, unregisterPlugin };
