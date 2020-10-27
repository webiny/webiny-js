import { MutationActionCallable } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { Plugin } from "@webiny/plugins/types";
import { PluginsAtomType } from "../pluginsAtom";
import { plugins } from "@webiny/plugins";

export const deactivatePluginByNameMutation: MutationActionCallable<PluginsAtomType, string> = (
    state,
    name
) => {
    const target = plugins.byName(name);
    if (!target) {
        return state;
    }
    return deactivatePluginMutation(state, target);
};

export const deactivatePluginMutation: MutationActionCallable<PluginsAtomType, Plugin> = (
    state,
    target
) => {
    const { type, name } = target;
    const allPluginsByType = state.get(type);
    if (!allPluginsByType || allPluginsByType.length === 0) {
        return state;
    }
    const filteredPluginsByType = allPluginsByType.filter(pl => pl.name !== name);
    if (filteredPluginsByType.length === allPluginsByType.length) {
        return state;
    }
    const newState = new Map(state);
    newState.set(type, filteredPluginsByType);
    return newState;
};
