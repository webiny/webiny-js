import { PluginsContainer } from "./PluginsContainer";
import { Plugin } from "./Plugin";

const plugins = new PluginsContainer();

export * from "./Plugin";
export { Plugin, PluginsContainer, plugins };
