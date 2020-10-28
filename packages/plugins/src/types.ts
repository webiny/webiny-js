export { PluginsContainer } from "./PluginsContainer";

export type Plugin<T = Record<string, any>> = {
    type: string;
    name?: string;
    init?: () => void;
    [key: string]: any;
} & T;

export type PluginCollection = (Plugin | PluginCollection)[];
