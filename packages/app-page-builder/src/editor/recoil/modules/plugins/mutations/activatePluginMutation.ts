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
