import { atom } from "recoil";

export type PluginsAtomPluginParamsType = {
    [key: string]: any;
};
export type PluginsAtomPluginType = {
    name: string;
    params?: PluginsAtomPluginParamsType;
};
export type PluginsAtomType = Record<string, PluginsAtomPluginType[]>;
export const pluginsAtom = atom<PluginsAtomType>({
    key: "pluginsAtom",
    default: {}
});
