import { MutationActionCallable } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { PluginsAtomType } from "../pluginsAtom";
import { plugins } from "@webiny/plugins";

export const deactivatePluginMutation: MutationActionCallable<PluginsAtomType, string> = (
    state,
    name
) => {
    const { type } = plugins.byName(name) || {};
    if (!type) {
        return state;
    }
    const allPluginsByType = state.get(type);
    if (!allPluginsByType || allPluginsByType.length === 0) {
        return state;
    }
    const filtered = allPluginsByType.filter(pl => pl.name !== name);
    if (filtered.length !== allPluginsByType.length) {
        return state;
    }
    return {
        ...state,
        [type]: filtered
    };
};
