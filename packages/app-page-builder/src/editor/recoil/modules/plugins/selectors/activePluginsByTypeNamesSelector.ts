import { selectorFamily } from "recoil";
import { pluginsAtom } from "../pluginsAtom";

export const activePluginsByTypeNamesSelector = selectorFamily<string[], string>({
    key: `activePluginsByTypeNamesSelector`,
    get: type => {
        return ({ get }) => {
            const activePlugins = get(pluginsAtom);
            const pluginsByType = activePlugins.get(type);
            if (!pluginsByType || pluginsByType.length === 0) {
                return [];
            }
            return pluginsByType.map(p => p.name);
        };
    }
});
