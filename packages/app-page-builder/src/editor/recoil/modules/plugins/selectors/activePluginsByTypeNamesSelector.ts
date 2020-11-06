import { connectedAtomValue } from "@webiny/app-page-builder/editor/recoil/modules/connected";
import { selectorFamily } from "recoil";
import { pluginsAtom } from "../pluginsAtom";

export const activePluginsByTypeNamesSelector = selectorFamily<string[], string>({
    key: `activePluginsByTypeNamesSelector`,
    get: type => {
        return ({ get }) => {
            const activePlugins = get(pluginsAtom);
            const pluginsByType = activePlugins[type];
            if (!pluginsByType || pluginsByType.length === 0) {
                return [];
            }
            return pluginsByType.map(p => p.name);
        };
    }
});

export const x = (type: string) => {
    const activePlugins = connectedAtomValue(pluginsAtom);
    const pluginsByType = activePlugins[type];
    if (!pluginsByType || pluginsByType.length === 0) {
        return [];
    }
    return pluginsByType.map(p => p.name);
};
