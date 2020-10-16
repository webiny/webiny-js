import {
    pluginsAtom,
    PluginsAtomPluginParamsType
} from "@webiny/app-page-builder/editor/recoil/modules";
import { plugins } from "@webiny/plugins";
import { useRecoilState } from "recoil";

type TogglePluginActionType = {
    name: string;
    params?: PluginsAtomPluginParamsType;
    closeOtherInGroup?: boolean;
};
export const togglePluginAction = ({
    name,
    params,
    closeOtherInGroup = false
}: TogglePluginActionType): void => {
    const plugin = plugins.byName(name);
    // TODO check if ok because error was not thrown in old action
    if (!plugin) {
        throw new Error(`There is no plugin with name "${name}".`);
    }
    const [pluginsAtomValue, setPluginsAtomValue] = useRecoilState(pluginsAtom);
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
