export { PluginsContainer } from "./PluginsContainer";
export declare type Plugin = {
    type: string;
    name?: string;
    init?: () => void;
    [key: string]: any;
};
export declare type PluginCollection = (Plugin | PluginCollection)[];
