import { atom } from "recoil";
import { Plugin } from "@webiny/plugins/types";

export type PluginsAtomType = Map<string, Plugin[]>;
export const pluginsAtom = atom<PluginsAtomType>({
    key: "pluginsAtom",
    default: new Map()
});
