import { PluginsAtomType } from "../../modules";
import { DeactivatePluginActionArgsType } from "./types";
import { plugins } from "@webiny/plugins";
import { EventActionCallable, EventActionHandlerActionCallableResponse } from "~/types";

const removePlugin = (state: PluginsAtomType, name: string): PluginsAtomType => {
    const plugin = plugins.byName(name);
    if (!plugin) {
        throw new Error(`There is no plugin with name "${name}".`);
    }
    const activePluginsByType = state[plugin.type] || [];

    return {
        ...state,
        [plugin.type]: activePluginsByType.filter(activePlugin => activePlugin.name !== plugin.name)
    };
};

const deactivatePluginByName = (
    state: PluginsAtomType,
    name: string
): EventActionHandlerActionCallableResponse => {
    const newState = removePlugin(state, name);

    return {
        state: {
            plugins: newState
        }
    };
};

const deactivatePluginByType = (
    state: PluginsAtomType,
    type: string
): EventActionHandlerActionCallableResponse => {
    return {
        state: {
            plugins: {
                ...state,
                [type]: []
            }
        }
    };
};

const deactivatePluginsByName = (
    state: PluginsAtomType,
    names: string[]
): EventActionHandlerActionCallableResponse => {
    let newState = {
        ...state
    };
    for (const name of names) {
        newState = removePlugin(newState, name);
    }
    return {
        state: {
            plugins: newState
        }
    };
};

export const deactivatePluginAction: EventActionCallable<DeactivatePluginActionArgsType> = (
    { plugins: pluginsState },
    _,
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
