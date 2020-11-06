import { TogglePluginActionArgsType } from "./types";
import { EventActionCallableType } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { plugins } from "@webiny/plugins";

export const togglePluginAction: EventActionCallableType<TogglePluginActionArgsType> = (
    state,
    args
) => {
    const { name, params = {}, closeOtherInGroup = false } = args;
    const plugin = plugins.byName(name);
    if (!plugin) {
        throw new Error(`There is no plugin with name "${name}".`);
    }
    const { plugins: pluginsAtomValue } = state;
    const activePluginsByType = pluginsAtomValue[plugin.type] || [];
    const isAlreadyActive = activePluginsByType.some(
        activePlugin => activePlugin.name === plugin.name
    );

    const newPluginState = {
        ...pluginsAtomValue
    };
    if (isAlreadyActive) {
        newPluginState[plugin.type] = activePluginsByType.filter(
            activePlugin => activePlugin.name !== plugin.name
        );
    } else if (closeOtherInGroup) {
        newPluginState[plugin.type] = [{ name, params }];
    } else {
        newPluginState[plugin.type] = activePluginsByType.concat([{ name, params }]);
    }

    return {
        state: {
            plugins: newPluginState
        }
    };
};
