import { atom } from "recoil";

export interface PluginsAtomPluginParamsType {
    [key: string]: any;
}
export interface PluginsAtomPluginType {
    name: string;
    params?: PluginsAtomPluginParamsType;
}
export interface PluginsAtomType {
    [key: string]: PluginsAtomPluginType[];
}
export const pluginsAtom = atom<PluginsAtomType>({
    key: "pluginsAtom",
    default: {}
});
