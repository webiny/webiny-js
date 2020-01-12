export { PluginsContainer } from "./PluginsContainer";

export type Plugin = {
    name: string;
    type: string;
    init?: () => void;
};
