import { DeactivatePluginActionArgsType } from "./types";
import { EventActionCallableType } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { plugins } from "@webiny/plugins";

export const deactivatePluginAction: EventActionCallableType<DeactivatePluginActionArgsType> = (
    { plugins: pluginsAtomValue },
    { name }
) => {
    const plugin = plugins.byName(name);
    if (!plugin) {
        throw new Error(`There is no plugin with name "${name}".`);
    }
    const activePluginsByType = pluginsAtomValue.get(plugin.type) || [];
    const newPluginMap = new Map(pluginsAtomValue);
    const newPluginsByType = activePluginsByType.filter(
        activePlugin => activePlugin.name !== plugin.name
    );
    newPluginMap.set(plugin.type, newPluginsByType);

    return {
        state: {
            plugins: newPluginMap
        }
    };
};
