import { plugins } from "@webiny/plugins";
import { Plugin } from "@webiny/plugins/types";
import { selectorFamily } from "recoil";
import { pluginsAtom, PluginsAtomType } from "../pluginsAtom";

export const isPluginActiveSelector = selectorFamily<boolean, string>({
    key: "isPluginActiveSelector",
    get: name => {
        return ({ get }) => {
            const target = plugins.byName(name);
            if (!target) {
                return false;
            }
            const state = get(pluginsAtom);
            return isPluginActive(state, target);
        };
    }
});

export const isPluginActive = (state: PluginsAtomType, target: Plugin): boolean => {
    const { type } = target;
    if (!state.has(type)) {
        return false;
    }
    const list = state.get(type);
    return list.some(({ name }) => {
        return name === target.name;
    });
};
