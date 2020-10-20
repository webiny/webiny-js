import { MutationActionCallable } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { PluginsAtomType } from "../pluginsAtom";
import { plugins } from "@webiny/plugins";

export const deactivatePluginMutation: MutationActionCallable<PluginsAtomType, string> = (
    pluginsState,
    name
) => {
    const { type } = plugins.byName(name) || {};
    if (!type) {
        return {};
    }
    const allPluginsByType = pluginsState.get(type);
    if (!allPluginsByType || allPluginsByType.length === 0) {
        return {};
    }
    const filtered = allPluginsByType.filter(pl => pl.name !== name);
    if (filtered.length !== allPluginsByType.length) {
        return {};
    }
    return {
        ...pluginsState,
        [type]: filtered
    };
};
