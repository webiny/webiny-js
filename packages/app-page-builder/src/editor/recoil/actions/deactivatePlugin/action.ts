import { PluginsAtomType } from "@webiny/app-page-builder/editor/recoil/modules";
import { DeactivatePluginActionArgsType } from "./types";
import {
    EventActionCallableType,
    EventActionHandlerActionCallableResponseType
} from "@webiny/app-page-builder/editor/recoil/eventActions";
import { plugins } from "@webiny/plugins";

const removePluginFromStateReference = (state: PluginsAtomType, name: string): void => {
    const plugin = plugins.byName(name);
    if (!plugin) {
        throw new Error(`There is no plugin with name "${name}".`);
    }
    const activePluginsByType = state.get(plugin.type) || [];
    const newPluginsByType = activePluginsByType.filter(
        activePlugin => activePlugin.name !== plugin.name
    );
    state.set(plugin.type, newPluginsByType);
};

const deactivatePluginByName = (
    state: PluginsAtomType,
    name: string
): EventActionHandlerActionCallableResponseType => {
    const newPluginState = new Map(state);
    removePluginFromStateReference(newPluginState, name);

    return {
        state: {
            plugins: newPluginState
        }
    };
};

const deactivatePluginByType = (
    state: PluginsAtomType,
    type: string
): EventActionHandlerActionCallableResponseType => {
    const newPluginMap = new Map(state);
    newPluginMap.set(type, []);
    return {
        state: {
            plugins: newPluginMap
        }
    };
};

const deactivatePluginsByName = (
    state: PluginsAtomType,
    names: string[]
): EventActionHandlerActionCallableResponseType => {
    const newPluginState = new Map(state);
    for (const name of names) {
        removePluginFromStateReference(newPluginState, name);
    }
    console.log(newPluginState);
    return {
        state: {
            plugins: newPluginState
        }
    };
};

export const deactivatePluginAction: EventActionCallableType<DeactivatePluginActionArgsType> = (
    { plugins: pluginsState },
    { name, names, type }
) => {
    if (name) {
        return deactivatePluginByName(pluginsState, name);
    } else if (type) {
        return deactivatePluginByType(pluginsState, type);
    } else if (names) {
        return deactivatePluginsByName(pluginsState, names);
    }
    throw new Error("You are trying to deactivate a plugin but did not pass info on which one.");
};
