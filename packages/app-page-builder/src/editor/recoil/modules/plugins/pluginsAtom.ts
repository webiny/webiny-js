import { connectedAtom } from "@webiny/app-page-builder/editor/recoil/modules/connected";

export type PluginsAtomPluginParamsType = {
    [key: string]: any;
};
export type PluginsAtomPluginType = {
    name: string;
    params?: PluginsAtomPluginParamsType;
};
export type PluginsAtomType = Map<string, PluginsAtomPluginType[]>;
export const pluginsAtom = connectedAtom<PluginsAtomType>({
    key: "pluginsAtom",
    default: new Map()
});
