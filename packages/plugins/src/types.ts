export { PluginsContainer } from "./PluginsContainer";

export type Plugin = {
    type: string;
    name?: string;
    init?: () => void;
    [key: string]: any;
};
