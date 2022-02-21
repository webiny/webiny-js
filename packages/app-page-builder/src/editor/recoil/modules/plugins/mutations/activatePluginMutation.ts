import { PluginsAtomType } from "../..";
import { plugins } from "@webiny/plugins";
import { EventActionHandlerMutationActionCallable } from "~/types";

export const activatePluginByNameMutation: EventActionHandlerMutationActionCallable<
    PluginsAtomType,
    string
> = (state, name) => {
    const { type } = plugins.byName(name) || {};
    if (!type) {
        return state;
    }
    const allPluginsByType = state[type] || [];
    const exists = allPluginsByType.some(pl => pl.name === name);
    if (exists) {
        return state;
    }
    return {
        ...state,
        [type]: allPluginsByType.concat([{ name }])
    };
};
