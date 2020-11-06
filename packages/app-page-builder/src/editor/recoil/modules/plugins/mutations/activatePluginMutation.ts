import { MutationActionCallable } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { PluginsAtomType } from "@webiny/app-page-builder/editor/recoil/modules";
import { plugins } from "@webiny/plugins";

export const activatePluginByNameMutation: MutationActionCallable<PluginsAtomType, string> = (
    state,
    name
) => {
    const { type } = plugins.byName(name) || {};
    if (!type) {
        return state;
    }
    const allPluginsByType = state.get(type) || [];
    const exists = allPluginsByType.some(pl => pl.name === name);
    if (exists) {
        return state;
    }
    const newState = new Map(state);
    newState.set(type, allPluginsByType.concat([{ name }]));
    return newState;
};
