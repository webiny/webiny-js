import { pluginsAtom, PluginsAtomPluginParamsType } from "@webiny/app-page-builder/editor/recoil/modules";
import { plugins } from "@webiny/plugins";
import React, { useCallback } from "react";
import { useRecoilState } from "recoil";

export type TogglePluginType = {
    name: string;
    params?: PluginsAtomPluginParamsType;
    closeOtherInGroup?: boolean;
};
type ProviderType = {
    togglePlugin: ({name}: TogglePluginType) => void;
};

const TogglePluginActionContext = React.createContext<ProviderType>(null);

const togglePlugin = ({name, closeOtherInGroup, params}: TogglePluginType, pluginsAtomValue, setPluginsAtomValue) => {
    const plugin = plugins.byName(name);
    if (!plugin) {
        throw new Error(`There is no plugin with name "${name}".`);
    }
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
    setPluginsAtomValue(newPluginMap);
};

const TogglePluginActionProvider = (props) => {
    const [pluginsAtomValue, setPluginsAtomValue] = useRecoilState(pluginsAtom);

    const value = {
        togglePlugin: (params: TogglePluginType) => {
            return togglePlugin(params, pluginsAtomValue, setPluginsAtomValue);
        },
    };
    return (
        <TogglePluginActionContext.Provider value={value} {...props} />
    );
};


const useTogglePluginAction = () => React.useContext(TogglePluginActionContext);

export {TogglePluginActionProvider, useTogglePluginAction};