import { TogglePluginActionArgsType } from "./types";
import { EventActionCallable } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { plugins } from "@webiny/plugins";

export const togglePluginAction: EventActionCallable<TogglePluginActionArgsType> = (
    state,
    args
) => {
    const { name, params, closeOtherInGroup = false } = args;
    const plugin = plugins.byName(name);
    if (!plugin) {
        throw new Error(`There is no plugin with name "${name}".`);
    }
    const { plugins: pluginsAtomValue } = state;
    const activePluginsByType = pluginsAtomValue.get(plugin.type) || [];
    const isAlreadyActive = activePluginsByType.some(
        activePlugin => activePlugin.name === plugin.name
    );

    const newPluginMap = new Map(pluginsAtomValue);
    if (isAlreadyActive) {
        const newPluginsByType = activePluginsByType.filter(
            activePlugin => activePlugin.name !== plugin.name
        );
        newPluginMap.set(plugin.type, newPluginsByType);
    } else if (closeOtherInGroup) {
        newPluginMap.set(plugin.type, [{ name, params }]);
    } else {
        activePluginsByType.push({ name, params });
        newPluginMap.set(plugin.type, activePluginsByType);
    }

    return {
        plugins: newPluginMap
    };
};
