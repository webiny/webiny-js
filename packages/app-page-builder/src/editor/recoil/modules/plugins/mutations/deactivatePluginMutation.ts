import { Plugin } from "@webiny/plugins/types";
import { PluginsAtomType } from "../pluginsAtom";
import { plugins } from "@webiny/plugins";
import { EventActionHandlerMutationActionCallable } from "~/types";

export const deactivatePluginByNameMutation: EventActionHandlerMutationActionCallable<
    PluginsAtomType,
    string
> = (state, name) => {
    const target = plugins.byName(name);
    if (!target) {
        return state;
    }
    return deactivatePluginMutation(state, target);
};

export const deactivatePluginMutation: EventActionHandlerMutationActionCallable<
    PluginsAtomType,
    Plugin
> = (state, target) => {
    const { type, name } = target;
    const allPluginsByType = state[type];
    if (!allPluginsByType || allPluginsByType.length === 0) {
        return state;
    }
    const filteredPluginsByType = allPluginsByType.filter(pl => pl.name !== name);
    if (filteredPluginsByType.length === allPluginsByType.length) {
        return state;
    }
    return {
        ...state,
        [type]: filteredPluginsByType
    };
};
